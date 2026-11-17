/*
 * The plugin this video writes — wp-content/plugins/arena-events (Arena Events Sync): the ONE source of the PHP that
 *   - VS Code shows and types (js/files.js, js/scenario.js — window.ARENA_PLUGIN), and
 *   - tools/snapshots/wp-saitama-arena-plugin/capture-wp.js installs into the real WordPress (require()) and runs there,
 * so the admin screens of the video are this code's real output.
 * The plugin is written for the demo (www.saitama-arena.co.jp's own code is not public). The external system it calls
 * (催事管理システム, https://saiji.sa.internal/api/v1) is invented; in the capture its answers come from a mock.
 *
 * files(stage): the files at a stage of the work — 0: as first written (three mistakes), 1: the API errors handled,
 * 2: the dates in the site's time zone, 3: PHPCS clean (= the final files). Indented with tabs (WordPress coding
 * standards); written here with 4 spaces.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ARENA_PLUGIN = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const DIR = 'wp-content/plugins/arena-events/';
  const tabs = (s) => s.replace(/^((?: {4})+)/gm, (m) => '\t'.repeat(m.length / 4));

  const F = {};

  F['arena-events.php'] = String.raw`<?php
/**
 * Plugin Name:       Arena Events Sync
 * Plugin URI:        https://www.saitama-arena.co.jp/schedule/
 * Description:       催事管理システムのイベント情報をイベントスケジュールへ自動で取り込みます（API 連携・毎日の自動同期・本日開催のイベント）。
 * Version:           1.0.0
 * Requires at least: 6.6
 * Requires PHP:      8.1
 * Author:            GMOアリーナさいたま Web チーム
 * Text Domain:       arena-events
 * Network:           true
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

define( 'ARENA_EVENTS_VERSION', '1.0.0' );
define( 'ARENA_EVENTS_DIR', plugin_dir_path( __FILE__ ) );
define( 'ARENA_EVENTS_CRON_HOOK', 'arena_events_daily_sync' );

require_once ARENA_EVENTS_DIR . 'includes/functions.php';
require_once ARENA_EVENTS_DIR . 'includes/class-arena-events-api.php';
require_once ARENA_EVENTS_DIR . 'includes/class-arena-events-importer.php';
require_once ARENA_EVENTS_DIR . 'includes/class-arena-events-admin.php';

if ( defined( 'WP_CLI' ) && WP_CLI ) {
    require_once ARENA_EVENTS_DIR . 'includes/class-arena-events-cli.php';
    WP_CLI::add_command( 'arena-events', 'Arena_Events_CLI' );
}

add_action( 'plugins_loaded', 'arena_events_init' );

/**
 * 本日開催のイベント（全サイト）と、イベントスケジュールのサイトの管理画面・自動同期。
 */
function arena_events_init() {
    add_action( 'rest_api_init', 'arena_events_register_routes' );
    add_shortcode( 'arena_today_events', 'arena_events_today_shortcode' );
    add_action( 'init', 'arena_events_register_taxonomy' );

    if ( ! arena_events_is_schedule_site() ) {
        return;
    }
    if ( is_admin() ) {
        new Arena_Events_Admin();
    }
    add_action( 'init', 'arena_events_schedule_cron' );
    add_action( ARENA_EVENTS_CRON_HOOK, 'arena_events_run_scheduled_sync' );
}
`;

  F['includes/functions.php'] = String.raw`<?php
/**
 * 設定・会場タイプ・本日開催のイベント（テンプレートタグ・ショートコード・REST API）・自動同期。
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

/**
 * イベントスケジュールのサイト（/schedule/）の ID。
 *
 * @return int
 */
function arena_events_schedule_blog_id() {
    static $blog_id = null;
    if ( null === $blog_id ) {
        $network = get_network();
        $site    = get_site_by_path( $network->domain, $network->path . 'schedule/' );
        $blog_id = $site ? (int) $site->blog_id : 0;
    }
    return $blog_id;
}

/**
 * いまのサイトがイベントスケジュールか。
 *
 * @return bool
 */
function arena_events_is_schedule_site() {
    return is_multisite() && get_current_blog_id() === arena_events_schedule_blog_id();
}

/**
 * 設定（既定値つき）。
 *
 * @return array
 */
function arena_events_settings() {
    $defaults = array(
        'api_url'      => '',
        'api_key'      => '',
        'sync_time'    => '05:00',
        'notify_email' => '',
    );
    return wp_parse_args( (array) get_option( 'arena_events_settings', array() ), $defaults );
}

/**
 * 会場タイプ（アリーナ・コミュニティアリーナ・けやきひろば …）。
 */
function arena_events_register_taxonomy() {
    register_taxonomy(
        'venue',
        'post',
        array(
            'label'             => __( '会場タイプ', 'arena-events' ),
            'hierarchical'      => true,
            'show_ui'           => arena_events_is_schedule_site(),
            'show_admin_column' => false,
            'show_in_rest'      => true,
            'rewrite'           => array( 'slug' => 'venue' ),
        )
    );
}

/**
 * 指定した日に開催中のイベント（開始日 <= 日付 <= 終了日）。
 *
 * @param string $date Y-m-d。省略時はサイトのタイムゾーンでの今日。
 * @return array
 */
function arena_events_get_by_date( $date = '' ) {
    if ( ! $date ) {
        $date = wp_date( 'Y-m-d' );
    }
    switch_to_blog( arena_events_schedule_blog_id() );
    $cache_key = 'arena_events_' . $date . '_' . get_option( 'arena_events_cache_ver', 1 );
    $events    = get_transient( $cache_key );
    if ( false === $events ) {
        $query  = new WP_Query(
            array(
                'post_type'      => 'post',
                'post_status'    => 'publish',
                'posts_per_page' => 20,
                'no_found_rows'  => true,
                'meta_key'       => 'event_start', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- 件数は月に数十件。
                'orderby'        => 'meta_value',
                'order'          => 'ASC',
                'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                    array(
                        'key'     => 'event_start',
                        'value'   => $date,
                        'compare' => '<=',
                        'type'    => 'DATE',
                    ),
                    array(
                        'key'     => 'event_end',
                        'value'   => $date,
                        'compare' => '>=',
                        'type'    => 'DATE',
                    ),
                ),
            )
        );
        $events = array();
        foreach ( $query->posts as $post ) {
            $venue    = get_the_terms( $post, 'venue' );
            $link     = get_post_meta( $post->ID, 'event_link', true );
            $events[] = array(
                'id'    => $post->ID,
                'title' => get_the_title( $post ),
                'url'   => $link ? $link : get_permalink( $post ),
                'image' => get_post_meta( $post->ID, 'event_image', true ),
                'start' => get_post_meta( $post->ID, 'event_start', true ),
                'end'   => get_post_meta( $post->ID, 'event_end', true ),
                'venue' => $venue && ! is_wp_error( $venue ) ? array(
                    'slug' => $venue[0]->slug,
                    'name' => $venue[0]->name,
                ) : null,
            );
        }
        set_transient( $cache_key, $events, 10 * MINUTE_IN_SECONDS );
    }
    restore_current_blog();
    return $events;
}

/**
 * トップページの「本日開催のイベント」（テーマと同じマークアップ）。
 *
 * @param string $date Y-m-d。
 * @return string
 */
function arena_events_today_list( $date = '' ) {
    $events = arena_events_get_by_date( $date );
    if ( ! $events ) {
        return '<p class="event-list_empty">' . esc_html__( '本日開催のイベントはありません。', 'arena-events' ) . '</p>';
    }
    $html = '<ul class="event-list">';
    foreach ( $events as $event ) {
        $html .= sprintf(
            '<li class="event-list_item"><a class="event-list_anchor" href="%1$s"><div class="event-thumbnail"><img class="event-thumbnail_image" src="%2$s" alt="%3$s"></div><div class="event-data"><div class="event-data_categories"><div class="event-data_cat -%4$s">%5$s</div></div><div class="event-data_title">%6$s</div></div></a></li>',
            esc_url( $event['url'] ),
            esc_url( $event['image'] ),
            esc_attr( $event['title'] ),
            esc_attr( $event['venue'] ? $event['venue']['slug'] : 'other' ),
            esc_html( $event['venue'] ? $event['venue']['name'] : '' ),
            esc_html( $event['title'] )
        );
    }
    return $html . '</ul>';
}

/**
 * [arena_today_events date="2026-11-13"]
 *
 * @param array $atts 属性。
 * @return string
 */
function arena_events_today_shortcode( $atts ) {
    $atts = shortcode_atts( array( 'date' => '' ), $atts, 'arena_today_events' );
    return arena_events_today_list( sanitize_text_field( $atts['date'] ) );
}

/**
 * GET /wp-json/arena-events/v1/daily?date=2026-11-13（トップページのカレンダー用）。
 */
function arena_events_register_routes() {
    register_rest_route(
        'arena-events/v1',
        '/daily',
        array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'arena_events_rest_daily',
            'permission_callback' => '__return_true',
            'args'                => array(
                'date' => array(
                    'type'    => 'string',
                    'pattern' => '^\d{4}-\d{2}-\d{2}$',
                ),
            ),
        )
    );
}

/**
 * 指定日のイベント（JSON）。
 *
 * @param WP_REST_Request $request リクエスト。
 * @return WP_REST_Response
 */
function arena_events_rest_daily( WP_REST_Request $request ) {
    $date = (string) $request->get_param( 'date' );
    return rest_ensure_response(
        array(
            'date'   => $date ? $date : wp_date( 'Y-m-d' ),
            'events' => arena_events_get_by_date( $date ),
        )
    );
}

/**
 * 毎日の自動同期（設定の時刻、サイトのタイムゾーン）。
 */
function arena_events_schedule_cron() {
    if ( wp_next_scheduled( ARENA_EVENTS_CRON_HOOK ) ) {
        return;
    }
    $next = new DateTimeImmutable( 'tomorrow ' . arena_events_settings()['sync_time'], wp_timezone() );
    wp_schedule_event( $next->getTimestamp(), 'daily', ARENA_EVENTS_CRON_HOOK );
}

/**
 * WP-Cron から。
 */
function arena_events_run_scheduled_sync() {
    ( new Arena_Events_Importer() )->sync( 'cron' );
}
`;

  F['includes/class-arena-events-api.php'] = String.raw`<?php
/**
 * 催事管理システムの API。
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

/**
 * GET {API の URL}/events?from=&to=（Bearer 認証）。
 */
class Arena_Events_API {

    /**
     * API の URL。
     *
     * @var string
     */
    private $base_url;

    /**
     * API キー。
     *
     * @var string
     */
    private $api_key;

    /**
     * コンストラクター。
     *
     * @param string $base_url API の URL。
     * @param string $api_key  API キー。
     */
    public function __construct( $base_url, $api_key ) {
        $this->base_url = untrailingslashit( $base_url );
        $this->api_key  = $api_key;
    }

    /**
     * 期間内のイベント。
     *
     * @param string $from 開始日（Y-m-d）。
     * @param string $to   終了日（Y-m-d）。
     * @return array|WP_Error
     */
    public function get_events( $from, $to ) {
        $url      = add_query_arg(
            array(
                'from' => $from,
                'to'   => $to,
            ),
            $this->base_url . '/events'
        );
        $response = wp_remote_get(
            $url,
            array(
                'timeout' => 15,
                'headers' => array(
                    'Authorization' => 'Bearer ' . $this->api_key,
                    'Accept'        => 'application/json',
                ),
            )
        );
        if ( is_wp_error( $response ) ) {
            return $response;
        }
        $code = (int) wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( 200 !== $code || ! isset( $data['events'] ) || ! is_array( $data['events'] ) ) {
            return new WP_Error(
                'arena_events_api',
                sprintf(
                    /* translators: 1: HTTP status code, 2: the API's message */
                    __( '催事管理システムの API エラー（%1$d）：%2$s', 'arena-events' ),
                    $code,
                    $data['message'] ?? __( '応答を読み取れません', 'arena-events' )
                )
            );
        }
        return $data['events'];
    }
}
`;

  F['includes/class-arena-events-importer.php'] = String.raw`<?php
/**
 * イベントの取り込み（投稿・カテゴリー・会場タイプ）とログ・通知。
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

/**
 * 催事管理システム → イベントスケジュールの投稿。
 */
class Arena_Events_Importer {

    /**
     * 催事管理システムのイベント ID（投稿のメタ）。
     */
    const META_ID = 'arena_event_id';

    /**
     * 同期する。
     *
     * @param string $trigger cron / manual / cli。
     * @param bool   $dry_run 保存しない。
     * @return array|WP_Error
     */
    public function sync( $trigger = 'manual', $dry_run = false ) {
        $settings = arena_events_settings();
        $api      = new Arena_Events_API( $settings['api_url'], $settings['api_key'] );
        $from     = wp_date( 'Y-m-01' );
        $to       = wp_date( 'Y-m-t', strtotime( '+5 months' ) );
        $events   = $api->get_events( $from, $to );

        if ( is_wp_error( $events ) ) {
            if ( ! $dry_run ) {
                $this->log( $trigger, 'error', array(), $events->get_error_message() );
                $this->notify( __( '同期できませんでした', 'arena-events' ), $events->get_error_message() );
            }
            return $events;
        }

        $result = array(
            'fetched' => count( $events ),
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'changes' => array(),
        );
        foreach ( $events as $event ) {
            $status = $this->save_event( $event, $dry_run );
            ++$result[ $status ];
            if ( 'skipped' !== $status ) {
                $result['changes'][] = array(
                    'id'     => $event['id'],
                    'title'  => $event['title'],
                    'start'  => $this->local_date( $event['start_date'] ),
                    'status' => $status,
                );
            }
        }
        if ( ! $dry_run ) {
            update_option( 'arena_events_cache_ver', time() );
            $this->log( $trigger, 'success', $result, '' );
            if ( $result['changes'] ) {
                $this->notify(
                    __( 'イベントを更新しました', 'arena-events' ),
                    implode( "\n", wp_list_pluck( $result['changes'], 'title' ) )
                );
            }
        }
        return $result;
    }

    /**
     * 1 件を投稿に（なければ追加・変わっていれば更新）。
     *
     * @param array $event   API のイベント。
     * @param bool  $dry_run 保存しない。
     * @return string created / updated / skipped
     */
    private function save_event( $event, $dry_run ) {
        $found   = get_posts(
            array(
                'post_type'      => 'post',
                'post_status'    => 'any',
                'meta_key'       => self::META_ID, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
                'meta_value'     => (string) $event['id'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
                'fields'         => 'ids',
                'posts_per_page' => 1,
            )
        );
        $post_id = $found ? (int) $found[0] : 0;
        $meta    = array(
            self::META_ID   => (string) $event['id'],
            'event_start'   => $this->local_date( $event['start_date'] ),
            'event_end'     => $this->local_date( $event['end_date'] ),
            'event_fee'     => (string) $event['fee'],
            'event_contact' => (string) $event['contact'],
            'event_link'    => esc_url_raw( (string) $event['url'] ),
            'event_image'   => esc_url_raw( (string) $event['image'] ),
        );
        if ( $post_id && $this->unchanged( $post_id, $event, $meta ) ) {
            return 'skipped';
        }
        if ( $dry_run ) {
            return $post_id ? 'updated' : 'created';
        }
        $postarr = array(
            'ID'          => $post_id,
            'post_type'   => 'post',
            'post_status' => 'publish',
            'post_title'  => $event['title'],
            'meta_input'  => $meta,
        );
        if ( ! empty( $event['slug'] ) ) {
            $postarr['post_name'] = $event['slug'];
        }
        $saved = $post_id ? wp_update_post( $postarr, true ) : wp_insert_post( $postarr, true );
        if ( is_wp_error( $saved ) ) {
            return 'skipped';
        }
        wp_set_object_terms( $saved, $event['category'], 'category' );
        wp_set_object_terms( $saved, $event['venue'], 'venue' );
        return $post_id ? 'updated' : 'created';
    }

    /**
     * API の日時（2026-11-14T00:00:00+09:00）→ サイトのタイムゾーンの日付。
     *
     * @param string $datetime ISO 8601。
     * @return string Y-m-d
     */
    private function local_date( $datetime ) {
        return wp_date( 'Y-m-d', strtotime( $datetime ) );
    }

    /**
     * タイトル・メタが前回と同じか。
     *
     * @param int   $post_id 投稿 ID。
     * @param array $event   API のイベント。
     * @param array $meta    保存するメタ。
     * @return bool
     */
    private function unchanged( $post_id, $event, $meta ) {
        if ( get_post_field( 'post_title', $post_id, 'raw' ) !== $event['title'] ) {
            return false;
        }
        foreach ( $meta as $key => $value ) {
            if ( (string) get_post_meta( $post_id, $key, true ) !== $value ) {
                return false;
            }
        }
        return true;
    }

    /**
     * 同期ログ（新しい順に 100 件）。
     *
     * @param string $trigger cron / manual / cli。
     * @param string $status  success / error。
     * @param array  $result  件数。
     * @param string $message エラーの内容。
     */
    private function log( $trigger, $status, $result, $message ) {
        $logs = (array) get_option( 'arena_events_log', array() );
        array_unshift(
            $logs,
            array(
                'time'    => time(),
                'trigger' => $trigger,
                'status'  => $status,
                'fetched' => $result['fetched'] ?? 0,
                'created' => $result['created'] ?? 0,
                'updated' => $result['updated'] ?? 0,
                'message' => $message,
            )
        );
        update_option( 'arena_events_log', array_slice( $logs, 0, 100 ), false );
    }

    /**
     * 担当者へメールで通知。
     *
     * @param string $subject 件名。
     * @param string $body    本文。
     */
    private function notify( $subject, $body ) {
        $to = arena_events_settings()['notify_email'];
        if ( is_email( $to ) ) {
            wp_mail( $to, '[イベント連携] ' . $subject, $body );
        }
    }
}
`;

  F['includes/class-arena-events-admin.php'] = String.raw`<?php
/**
 * 管理画面：イベント連携（同期ログ・設定）、投稿一覧の開催日。
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

/**
 * イベントスケジュールのサイトの管理画面。
 */
class Arena_Events_Admin {

    /**
     * フック。
     */
    public function __construct() {
        add_action( 'admin_menu', array( $this, 'menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        add_action( 'admin_post_arena_events_sync', array( $this, 'handle_sync' ) );
        add_action( 'admin_notices', array( $this, 'notices' ) );
        add_action( 'update_option_arena_events_settings', array( $this, 'reschedule' ), 10, 2 );
        add_filter( 'manage_post_posts_columns', array( $this, 'columns' ) );
        add_action( 'manage_post_posts_custom_column', array( $this, 'column' ), 10, 2 );
    }

    /**
     * メニュー：イベント連携 › 同期ログ / 設定。
     */
    public function menu() {
        add_menu_page( __( 'イベント連携', 'arena-events' ), __( 'イベント連携', 'arena-events' ), 'manage_options', 'arena-events', array( $this, 'log_page' ), 'dashicons-update', 25 );
        add_submenu_page( 'arena-events', __( '同期ログ', 'arena-events' ), __( '同期ログ', 'arena-events' ), 'manage_options', 'arena-events', array( $this, 'log_page' ) );
        add_submenu_page( 'arena-events', __( 'イベント連携の設定', 'arena-events' ), __( '設定', 'arena-events' ), 'manage_options', 'arena-events-settings', array( $this, 'settings_page' ) );
    }

    /**
     * 設定（Settings API）。
     */
    public function register_settings() {
        register_setting(
            'arena_events',
            'arena_events_settings',
            array(
                'type'              => 'array',
                'sanitize_callback' => array( $this, 'sanitize' ),
            )
        );
        add_settings_section( 'arena_events_api', __( '催事管理システム（API）', 'arena-events' ), '__return_false', 'arena-events-settings' );
        add_settings_field( 'api_url', __( 'API の URL', 'arena-events' ), array( $this, 'field' ), 'arena-events-settings', 'arena_events_api', array( 'key' => 'api_url', 'type' => 'url', 'label_for' => 'arena_events_api_url', 'desc' => __( '例：https://saiji.sa.internal/api/v1', 'arena-events' ) ) );
        add_settings_field( 'api_key', __( 'API キー', 'arena-events' ), array( $this, 'field' ), 'arena-events-settings', 'arena_events_api', array( 'key' => 'api_key', 'type' => 'password', 'label_for' => 'arena_events_api_key', 'desc' => __( '催事管理システムの「外部連携」で発行したキー', 'arena-events' ) ) );
        add_settings_section( 'arena_events_sync', __( '自動同期・通知', 'arena-events' ), '__return_false', 'arena-events-settings' );
        add_settings_field( 'sync_time', __( '毎日の同期時刻', 'arena-events' ), array( $this, 'field' ), 'arena-events-settings', 'arena_events_sync', array( 'key' => 'sync_time', 'type' => 'time', 'label_for' => 'arena_events_sync_time', 'desc' => '' ) );
        add_settings_field( 'notify_email', __( '通知先メールアドレス', 'arena-events' ), array( $this, 'field' ), 'arena-events-settings', 'arena_events_sync', array( 'key' => 'notify_email', 'type' => 'email', 'label_for' => 'arena_events_notify_email', 'desc' => __( '同期の失敗・イベントの追加や変更をお知らせします。', 'arena-events' ) ) );
    }

    /**
     * 入力欄。
     *
     * @param array $args key / type / label_for / desc。
     */
    public function field( $args ) {
        $settings = arena_events_settings();
        printf(
            '<input type="%1$s" id="%2$s" name="arena_events_settings[%3$s]" value="%4$s" class="regular-text">',
            esc_attr( $args['type'] ),
            esc_attr( $args['label_for'] ),
            esc_attr( $args['key'] ),
            esc_attr( $settings[ $args['key'] ] )
        );
        if ( $args['desc'] ) {
            printf( '<p class="description">%s</p>', esc_html( $args['desc'] ) );
        }
    }

    /**
     * 保存前に整える。
     *
     * @param mixed $input フォームの値。
     * @return array
     */
    public function sanitize( $input ) {
        $input = is_array( $input ) ? $input : array();
        $time  = $input['sync_time'] ?? '';
        return array(
            'api_url'      => esc_url_raw( trim( $input['api_url'] ?? '' ) ),
            'api_key'      => sanitize_text_field( $input['api_key'] ?? '' ),
            'sync_time'    => preg_match( '/^([01]\d|2[0-3]):[0-5]\d$/', $time ) ? $time : '05:00',
            'notify_email' => sanitize_email( $input['notify_email'] ?? '' ),
        );
    }

    /**
     * 同期時刻を変えたら自動同期を組み直す。
     *
     * @param array $old_value 前の設定。
     * @param array $value     新しい設定。
     */
    public function reschedule( $old_value, $value ) {
        if ( ( $old_value['sync_time'] ?? '' ) !== ( $value['sync_time'] ?? '' ) ) {
            wp_clear_scheduled_hook( ARENA_EVENTS_CRON_HOOK );
        }
    }

    /**
     * イベント連携 › 設定。
     */
    public function settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        echo '<div class="wrap"><h1>' . esc_html( get_admin_page_title() ) . '</h1>';
        settings_errors();
        echo '<form method="post" action="options.php">';
        settings_fields( 'arena_events' );
        do_settings_sections( 'arena-events-settings' );
        submit_button();
        echo '</form></div>';
    }

    /**
     * イベント連携 › 同期ログ（今すぐ同期・次回の自動同期）。
     */
    public function log_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }
        require_once ARENA_EVENTS_DIR . 'includes/class-arena-events-log-table.php';
        $table = new Arena_Events_Log_Table();
        $table->prepare_items();
        $next = wp_next_scheduled( ARENA_EVENTS_CRON_HOOK );
        $sync = wp_nonce_url( admin_url( 'admin-post.php?action=arena_events_sync' ), 'arena_events_sync' );
        echo '<style>.arena-events-ok{color:#008a20;font-weight:600}.arena-events-error{color:#d63638;font-weight:600}.column-time{width:11em}.column-trigger{width:9em}.column-status,.column-fetched,.column-created,.column-updated{width:5em}</style>';
        echo '<div class="wrap"><h1 class="wp-heading-inline">' . esc_html__( 'イベント連携', 'arena-events' ) . '</h1>';
        echo ' <a href="' . esc_url( $sync ) . '" class="page-title-action">' . esc_html__( '今すぐ同期', 'arena-events' ) . '</a>';
        echo '<hr class="wp-header-end">';
        printf(
            '<p>%s</p>',
            esc_html(
                sprintf(
                    /* translators: %s: date and time of the next run */
                    __( '次回の自動同期：%s（毎日、設定の時刻に催事管理システムから取り込みます）', 'arena-events' ),
                    $next ? wp_date( 'Y年n月j日 H:i', $next ) : __( '未設定', 'arena-events' )
                )
            )
        );
        $table->display();
        echo '</div>';
    }

    /**
     * 今すぐ同期（admin-post.php）。
     */
    public function handle_sync() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'この操作を行う権限がありません。', 'arena-events' ), 403 );
        }
        check_admin_referer( 'arena_events_sync' );
        $result = ( new Arena_Events_Importer() )->sync( 'manual' );
        wp_safe_redirect( add_query_arg( 'arena_events_result', is_wp_error( $result ) ? 'error' : 'success', admin_url( 'admin.php?page=arena-events' ) ) );
        exit;
    }

    /**
     * 同期の結果。
     */
    public function notices() {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- 結果を表示するだけ（処理はしない）。
        $result = isset( $_GET['arena_events_result'] ) ? sanitize_key( wp_unslash( $_GET['arena_events_result'] ) ) : '';
        if ( ! $result ) {
            return;
        }
        $logs = (array) get_option( 'arena_events_log', array() );
        $last = $logs ? $logs[0] : array();
        if ( 'success' === $result ) {
            $type = 'success';
            /* translators: 1: fetched, 2: added, 3: updated */
            $message = sprintf( __( '同期しました：取得 %1$d 件・追加 %2$d 件・更新 %3$d 件', 'arena-events' ), $last['fetched'] ?? 0, $last['created'] ?? 0, $last['updated'] ?? 0 );
        } else {
            $type = 'error';
            /* translators: %s: the error */
            $message = sprintf( __( '同期できませんでした。%s', 'arena-events' ), $last['message'] ?? '' );
        }
        printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', esc_attr( $type ), esc_html( $message ) );
    }

    /**
     * 投稿一覧に「開催日」「会場タイプ」。
     *
     * @param array $columns 列。
     * @return array
     */
    public function columns( $columns ) {
        $columns['event_date']  = __( '開催日', 'arena-events' );
        $columns['event_venue'] = __( '会場タイプ', 'arena-events' );
        return $columns;
    }

    /**
     * 列の中身。
     *
     * @param string $column  列。
     * @param int    $post_id 投稿 ID。
     */
    public function column( $column, $post_id ) {
        if ( 'event_date' === $column ) {
            $start = (string) get_post_meta( $post_id, 'event_start', true );
            $end   = (string) get_post_meta( $post_id, 'event_end', true );
            echo esc_html( $start ? str_replace( '-', '/', $start ) . ' ～ ' . str_replace( '-', '/', $end ) : '—' );
        } elseif ( 'event_venue' === $column ) {
            $terms = get_the_terms( $post_id, 'venue' );
            echo esc_html( $terms && ! is_wp_error( $terms ) ? implode( ' / ', wp_list_pluck( $terms, 'name' ) ) : '—' );
        }
    }
}
`;

  F['includes/class-arena-events-log-table.php'] = String.raw`<?php
/**
 * 同期ログの一覧（WP_List_Table）。
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WP_List_Table' ) ) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

/**
 * イベント連携 › 同期ログ。
 */
class Arena_Events_Log_Table extends WP_List_Table {

    /**
     * コンストラクター。
     */
    public function __construct() {
        parent::__construct(
            array(
                'singular' => 'log',
                'plural'   => 'logs',
                'ajax'     => false,
            )
        );
    }

    /**
     * 列。
     *
     * @return array
     */
    public function get_columns() {
        return array(
            'time'    => __( '日時', 'arena-events' ),
            'trigger' => __( '実行', 'arena-events' ),
            'status'  => __( '結果', 'arena-events' ),
            'fetched' => __( '取得', 'arena-events' ),
            'created' => __( '追加', 'arena-events' ),
            'updated' => __( '更新', 'arena-events' ),
            'message' => __( 'メッセージ', 'arena-events' ),
        );
    }

    /**
     * 1 ページ 20 件。
     */
    public function prepare_items() {
        $logs     = (array) get_option( 'arena_events_log', array() );
        $per_page = 20;
        $paged    = $this->get_pagenum();

        $this->_column_headers = array( $this->get_columns(), array(), array() );
        $this->items           = array_slice( $logs, ( $paged - 1 ) * $per_page, $per_page );
        $this->set_pagination_args(
            array(
                'total_items' => count( $logs ),
                'per_page'    => $per_page,
            )
        );
    }

    /**
     * セル。
     *
     * @param array  $item        ログ。
     * @param string $column_name 列。
     * @return string
     */
    protected function column_default( $item, $column_name ) {
        switch ( $column_name ) {
            case 'time':
                return esc_html( wp_date( 'Y/m/d H:i:s', $item['time'] ) );
            case 'trigger':
                $labels = array(
                    'cron'   => __( '自動（WP-Cron）', 'arena-events' ),
                    'manual' => __( '手動', 'arena-events' ),
                    'cli'    => 'WP-CLI',
                );
                return esc_html( $labels[ $item['trigger'] ] ?? $item['trigger'] );
            case 'status':
                return 'success' === $item['status']
                    ? '<span class="arena-events-ok">' . esc_html__( '成功', 'arena-events' ) . '</span>'
                    : '<span class="arena-events-error">' . esc_html__( 'エラー', 'arena-events' ) . '</span>';
            case 'message':
                return esc_html( $item['message'] );
            default:
                return esc_html( (string) ( $item[ $column_name ] ?? '' ) );
        }
    }

    /**
     * ログがないとき。
     */
    public function no_items() {
        esc_html_e( 'まだ同期していません。', 'arena-events' );
    }
}
`;

  F['includes/class-arena-events-cli.php'] = String.raw`<?php
/**
 * WP-CLI：wp arena-events sync
 *
 * @package Arena_Events
 */

defined( 'ABSPATH' ) || exit;

/**
 * 催事管理システムとの同期。
 */
class Arena_Events_CLI {

    /**
     * 催事管理システムからイベントを取り込む。
     *
     * ## OPTIONS
     *
     * [--dry-run]
     * : 保存せずに、追加・更新されるイベントを表示する。
     *
     * ## EXAMPLES
     *
     *     wp arena-events sync --url=https://www.saitama-arena.co.jp/schedule/
     *
     * @param array $args       引数。
     * @param array $assoc_args オプション。
     */
    public function sync( $args, $assoc_args ) {
        if ( ! arena_events_is_schedule_site() ) {
            WP_CLI::error( 'イベントスケジュールのサイトで実行してください（--url=…/schedule/）。' );
        }
        $dry_run = (bool) WP_CLI\Utils\get_flag_value( $assoc_args, 'dry-run', false );
        $result  = ( new Arena_Events_Importer() )->sync( 'cli', $dry_run );
        if ( is_wp_error( $result ) ) {
            WP_CLI::error( $result->get_error_message() );
        }
        if ( $result['changes'] ) {
            WP_CLI\Utils\format_items( 'table', $result['changes'], array( 'id', 'title', 'start', 'status' ) );
        }
        WP_CLI::success( sprintf( '取得 %d 件・追加 %d 件・更新 %d 件%s', $result['fetched'], $result['created'], $result['updated'], $dry_run ? '（dry run：保存していません）' : '' ) );
    }
}
`;

  /*
   * the three mistakes: [file, as the final file has it, as it was first written] — files(stage) puts back the ones
   * not fixed yet (stage 0: all three)
   */
  const BUGS = [
    // 1. the API's answer used without a check: a 404 (the URL without /v1) → null → count(null): TypeError (PHP 8)
    ['includes/class-arena-events-api.php',
      `        if ( is_wp_error( $response ) ) {
            return $response;
        }
        $code = (int) wp_remote_retrieve_response_code( $response );
        $data = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( 200 !== $code || ! isset( $data['events'] ) || ! is_array( $data['events'] ) ) {
            return new WP_Error(
                'arena_events_api',
                sprintf(
                    /* translators: 1: HTTP status code, 2: the API's message */
                    __( '催事管理システムの API エラー（%1$d）：%2$s', 'arena-events' ),
                    $code,
                    $data['message'] ?? __( '応答を読み取れません', 'arena-events' )
                )
            );
        }
        return $data['events'];`,
      `        $data = json_decode( wp_remote_retrieve_body( $response ), true );
        return $data['events'];`],
    ['includes/class-arena-events-importer.php',
      `        $events   = $api->get_events( $from, $to );

        if ( is_wp_error( $events ) ) {
            if ( ! $dry_run ) {
                $this->log( $trigger, 'error', array(), $events->get_error_message() );
                $this->notify( __( '同期できませんでした', 'arena-events' ), $events->get_error_message() );
            }
            return $events;
        }
`,
      `        $events   = $api->get_events( $from, $to );
`],
    // 2. the date in UTC: 2026-11-14T00:00:00+09:00 → 2026-11-13
    ['includes/class-arena-events-importer.php',
      `        return wp_date( 'Y-m-d', strtotime( $datetime ) );`,
      `        return gmdate( 'Y-m-d', strtotime( $datetime ) );`],
    // 3. PHPCS: $_GET not unslashed / sanitized, the notice not escaped
    ['includes/class-arena-events-admin.php',
      `        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- 結果を表示するだけ（処理はしない）。
        $result = isset( $_GET['arena_events_result'] ) ? sanitize_key( wp_unslash( $_GET['arena_events_result'] ) ) : '';`,
      `        $result = $_GET['arena_events_result'] ?? '';`],
    ['includes/class-arena-events-admin.php',
      `        printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', esc_attr( $type ), esc_html( $message ) );`,
      `        echo '<div class="notice notice-' . $type . ' is-dismissible"><p>' . $message . '</p></div>';`],
  ];
  // the stage at which each of BUGS is fixed
  const FIXED_AT = [1, 1, 2, 3, 3];

  /** the plugin's files at a stage (paths relative to the plugin folder), tab-indented */
  function files(stage = 3) {
    const out = {};
    for (const [p, text] of Object.entries(F)) out[p] = text;
    BUGS.forEach(([p, good, bad], i) => {
      if (stage >= FIXED_AT[i]) return;
      if (!out[p].includes(good)) throw new Error('ARENA_PLUGIN: fix ' + i + ' not found in ' + p);
      out[p] = out[p].split(good).join(bad);
    });
    for (const p of Object.keys(out)) out[p] = tabs(out[p]);
    return out;
  }
  /** the snippets of a mistake, tab-indented: { file, good, bad } */
  const bug = (i) => ({ file: BUGS[i][0], good: tabs(BUGS[i][1]), bad: tabs(BUGS[i][2]) });

  return { DIR, files, bug, tabs, ORDER: Object.keys(F) };
});
