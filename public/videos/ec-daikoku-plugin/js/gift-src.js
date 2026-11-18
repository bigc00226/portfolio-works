/*
 * The dedicated plugin this video writes for あみだ池大黒オンラインショップ's EC-CUBE 4 (app/Plugin/DaikokuGift — のし指定:
 * 外のし / 内のし, 表書き, 名入れ per お届け先): the ONE source of the code that
 *   - VS Code shows and types (js/files.js, js/scenario.js — window.DGIFT_SRC), and
 *   - tools/snapshots/ec-daikoku-plugin/capture-ec.js writes into the local EC-CUBE 4.3.1-p1 (require()), on top of the
 *     skeleton `bin/console eccube:plugin:generate` really made there, installs / enables / disables / uninstalls there and
 *     finally packs as DaikokuGift-1.0.0.zip and uploads through the admin's 独自プラグイン form — so every EC-CUBE screen of
 *     the video is this code's output.
 * Written for the demo (the shop's own code is not public). PSR-12 (4 spaces), as EC-CUBE's own code.
 *
 * files(stage):
 *   1  the admin side: Config (the generated entity, changed), NoshiTitle (表書き master) + repositories, PluginManager
 *      (初期データ), Nav (own menu のし・ギフト), ConfigController / NoshiTitleController, forms, admin Twig, messages
 *   2  + ProductTrait (のし対応, @FormAppend → 商品登録), ShippingTrait (のし per お届け先), ShippingTypeExtension (注文手続き),
 *      Event (TemplateEvent: Shopping/index.twig, Shopping/confirm.twig) + Twig
 *      (written after the plugin is installed: the proxies are not made again → システムエラー until eccube:generate:proxies)
 *   3  + 受注登録 (the same extension on the admin ShippingType, @admin/Order/edit.twig) and the 注文受付メール (Mail/order.twig)
 *   4  + PluginManager: 配送CSV items on enable, removed on disable / uninstall
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DGIFT_SRC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const P = 'app/Plugin/DaikokuGift/';

  /* the skeleton `bin/console eccube:plugin:generate "あみだ池大黒 ギフトのし" DaikokuGift 1.0.0` writes (EC-CUBE 4.3.1-p1) */
  const SCAFFOLD = {};
  SCAFFOLD['composer.json'] = `{
  "name": "ec-cube/daikokugift",
  "version": "1.0.0",
  "description": "あみだ池大黒 ギフトのし",
  "type": "eccube-plugin",
  "require": {
    "ec-cube/plugin-installer": "~0.0.7 || ^2.0"
  },
  "extra": {
    "code": "DaikokuGift"
  }
}`;
  SCAFFOLD['Event.php'] = String.raw`<?php

namespace Plugin\DaikokuGift;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class Event implements EventSubscriberInterface
{
    /**
     * @return array
     */
    public static function getSubscribedEvents()
    {
        return [];
    }
}
`;
  SCAFFOLD['Nav.php'] = String.raw`<?php

namespace Plugin\DaikokuGift;

use Eccube\Common\EccubeNav;

class Nav implements EccubeNav
{
    /**
     * @return array
     */
    public static function getNav()
    {
        return [];
    }
}
`;
  SCAFFOLD['TwigBlock.php'] = String.raw`<?php

namespace Plugin\DaikokuGift;

use Eccube\Common\EccubeTwigBlock;

class TwigBlock implements EccubeTwigBlock
{
    /**
     * @return array
     */
    public static function getTwigBlock()
    {
        return [];
    }
}
`;
  SCAFFOLD['Controller/Admin/ConfigController.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Controller\Admin;

use Eccube\Controller\AbstractController;
use Plugin\DaikokuGift\Form\Type\Admin\ConfigType;
use Plugin\DaikokuGift\Repository\ConfigRepository;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ConfigController extends AbstractController
{
    /**
     * @var ConfigRepository
     */
    protected $configRepository;

    /**
     * ConfigController constructor.
     *
     * @param ConfigRepository $configRepository
     */
    public function __construct(ConfigRepository $configRepository)
    {
        $this->configRepository = $configRepository;
    }

    /**
     * @Route("/%eccube_admin_route%/daikoku_gift/config", name="daikoku_gift_admin_config")
     * @Template("@DaikokuGift/admin/config.twig")
     */
    public function index(Request $request)
    {
        $Config = $this->configRepository->get();
        $form = $this->createForm(ConfigType::class, $Config);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $Config = $form->getData();
            $this->entityManager->persist($Config);
            $this->entityManager->flush();
            $this->addSuccess('登録しました。', 'admin');

            return $this->redirectToRoute('daikoku_gift_admin_config');
        }

        return [
            'form' => $form->createView(),
        ];
    }
}
`;
  SCAFFOLD['Entity/Config.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Entity;

use Doctrine\ORM\Mapping as ORM;

if (!class_exists('\Plugin\DaikokuGift\Entity\Config', false)) {
    /**
     * Config
     *
     * @ORM\Table(name="plg_daikoku_gift_config")
     * @ORM\Entity(repositoryClass="Plugin\DaikokuGift\Repository\ConfigRepository")
     */
    class Config
    {
        /**
         * @var int
         *
         * @ORM\Column(name="id", type="integer", options={"unsigned":true})
         * @ORM\Id
         * @ORM\GeneratedValue(strategy="IDENTITY")
         */
        private $id;

        /**
         * @var string
         *
         * @ORM\Column(name="name", type="string", length=255)
         */
        private $name;

        /**
         * @return int
         */
        public function getId()
        {
            return $this->id;
        }

        /**
         * @return string
         */
        public function getName()
        {
            return $this->name;
        }

        /**
         * @param string $name
         *
         * @return $this;
         */
        public function setName($name)
        {
            $this->name = $name;

            return $this;
        }
    }
}
`;
  SCAFFOLD['Repository/ConfigRepository.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Repository;

use Doctrine\Persistence\ManagerRegistry;
use Eccube\Repository\AbstractRepository;
use Plugin\DaikokuGift\Entity\Config;

/**
 * ConfigRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class ConfigRepository extends AbstractRepository
{
    /**
     * ConfigRepository constructor.
     *
     * @param ManagerRegistry $registry
     */
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Config::class);
    }

    /**
     * @param int $id
     *
     * @return Config
     *
     * @throws \Exception
     */
    public function get($id = 1)
    {
        $Config = $this->find($id);

        if (null === $Config) {
            throw new \Exception('Config not found. id = '.$id);
        }

        return $Config;
    }
}
`;
  SCAFFOLD['Form/Type/Admin/ConfigType.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Form\Type\Admin;

use Plugin\DaikokuGift\Entity\Config;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

class ConfigType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('name', TextType::class, [
            'constraints' => [
                new NotBlank(),
                new Length(['max' => 255]),
            ],
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Config::class,
        ]);
    }
}
`;
  SCAFFOLD['Resource/template/admin/config.twig'] = `{% extends '@admin/default_frame.twig' %}

{% set menus = ['store', 'plugin', 'plugin_list'] %}

{% block title %}DaikokuGift{% endblock %}
{% block sub_title %}プラグイン一覧{% endblock %}

{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}

{% block stylesheet %}{% endblock stylesheet %}

{% block javascript %}{% endblock javascript %}

{% block main %}
    <form role="form" method="post">

        {{ form_widget(form._token) }}

        <div class="c-contentsArea__cols">
            <div class="c-contentsArea__primaryCol">
                <div class="c-primaryCol">
                    <div class="card rounded border-0 mb-4">
                        <div class="card-header"><span>設定</span></div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-3"><span>名前</span><span
                                            class="badge bg-primary ml-1">必須</span></div>
                                <div class="col mb-2">
                                    {{ form_widget(form.name) }}
                                    {{ form_errors(form.name) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="c-conversionArea">
            <div class="c-conversionArea__container">
                <div class="row justify-content-between align-items-center">
                    <div class="col-6">
                        <div class="c-conversionArea__leftBlockItem">
                            <a class="c-baseLink"
                               href="{{ url('admin_store_plugin') }}">
                                <i class="fa fa-backward" aria-hidden="true"></i>
                                <span>プラグイン一覧</span>
                            </a>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="row align-items-center justify-content-end">
                            <div class="col-auto">
                                <button class="btn btn-ec-conversion px-5"
                                        type="submit">登録</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
{% endblock %}
`;
  SCAFFOLD['Resource/locale/messages.ja.yaml'] = '';
  SCAFFOLD['Resource/locale/validators.ja.yaml'] = '';
  SCAFFOLD['.github/workflows/release.yml'] = `
name: Packaging for EC-CUBE Plugin
on:
  release:
    types: [ published ]
jobs:
  deploy:
    name: Build
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Packaging
        working-directory: ../
        run: |
          rm -rf $GITHUB_WORKSPACE/.github
          find $GITHUB_WORKSPACE -name "dummy" -delete
          find $GITHUB_WORKSPACE -name ".git*" -and ! -name ".gitkeep" -print0 | xargs -0 rm -rf
          chmod -R o+w $GITHUB_WORKSPACE
          cd $GITHUB_WORKSPACE
          tar cvzf ../\${{ github.event.repository.name }}-\${{ github.event.release.tag_name }}.tar.gz ./*
      - name: Upload binaries to release of TGZ
        uses: svenstaro/upload-release-action@v1-release
        with:
          repo_token: \${{ secrets.GITHUB_TOKEN }}
          file: \${{ runner.workspace }}/\${{ github.event.repository.name }}-\${{ github.event.release.tag_name }}.tar.gz
          asset_name: \${{ github.event.repository.name }}-\${{ github.event.release.tag_name }}.tar.gz
          tag: \${{ github.ref }}
          overwrite: true
`;

  /* ------------------------------------------------------------ the plugin (staged: see staged()) */
  const F = {};

  F['Entity/Config.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Entity\AbstractEntity;

if (!class_exists('\Plugin\DaikokuGift\Entity\Config', false)) {
    /**
     * のし指定の設定（1 件だけ）
     *
     * @ORM\Table(name="plg_daikoku_gift_config")
     * @ORM\Entity(repositoryClass="Plugin\DaikokuGift\Repository\ConfigRepository")
     */
    class Config extends AbstractEntity
    {
        /**
         * @var int
         *
         * @ORM\Column(name="id", type="integer", options={"unsigned":true})
         * @ORM\Id
         * @ORM\GeneratedValue(strategy="IDENTITY")
         */
        private $id;

        /**
         * 注文手続きで のし指定を受け付ける
         *
         * @var bool
         *
         * @ORM\Column(name="accept", type="boolean", options={"default":true})
         */
        private $accept = true;

        /**
         * 名入れの最大文字数
         *
         * @var int
         *
         * @ORM\Column(name="name_max_length", type="smallint", options={"unsigned":true, "default":10})
         */
        private $name_max_length = 10;

        /**
         * 注文手続きの のし欄に出す案内
         *
         * @var string|null
         *
         * @ORM\Column(name="guide_text", type="string", length=255, nullable=true)
         */
        private $guide_text;

        public function getId()
        {
            return $this->id;
        }

        public function isAccept()
        {
            return $this->accept;
        }

        public function setAccept($accept)
        {
            $this->accept = (bool) $accept;

            return $this;
        }

        public function getNameMaxLength()
        {
            return $this->name_max_length;
        }

        public function setNameMaxLength($nameMaxLength)
        {
            $this->name_max_length = (int) $nameMaxLength;

            return $this;
        }

        public function getGuideText()
        {
            return $this->guide_text;
        }

        public function setGuideText($guideText)
        {
            $this->guide_text = $guideText;

            return $this;
        }
    }
}
`;

  F['Entity/NoshiTitle.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Entity\AbstractEntity;

if (!class_exists('\Plugin\DaikokuGift\Entity\NoshiTitle', false)) {
    /**
     * のしの表書き（御歳暮・御礼 …）
     *
     * @ORM\Table(name="plg_daikoku_gift_noshi_title")
     * @ORM\Entity(repositoryClass="Plugin\DaikokuGift\Repository\NoshiTitleRepository")
     */
    class NoshiTitle extends AbstractEntity
    {
        /** のしの種類（お届け先の noshi_type） */
        public const TYPES = ['outer' => '外のし', 'inner' => '内のし'];

        /** 水引 */
        public const MIZUHIKI = ['紅白蝶結び', '紅白結び切り', '黒白結び切り', '黄白結び切り'];

        /**
         * @var int
         *
         * @ORM\Column(name="id", type="integer", options={"unsigned":true})
         * @ORM\Id
         * @ORM\GeneratedValue(strategy="IDENTITY")
         */
        private $id;

        /**
         * @var string
         *
         * @ORM\Column(name="name", type="string", length=50)
         */
        private $name;

        /**
         * @var string
         *
         * @ORM\Column(name="mizuhiki", type="string", length=20)
         */
        private $mizuhiki;

        /**
         * @var int
         *
         * @ORM\Column(name="sort_no", type="smallint", options={"unsigned":true})
         */
        private $sort_no = 0;

        /**
         * @var bool
         *
         * @ORM\Column(name="visible", type="boolean", options={"default":true})
         */
        private $visible = true;

        public function getId()
        {
            return $this->id;
        }

        public function getName()
        {
            return $this->name;
        }

        public function setName($name)
        {
            $this->name = $name;

            return $this;
        }

        public function getMizuhiki()
        {
            return $this->mizuhiki;
        }

        public function setMizuhiki($mizuhiki)
        {
            $this->mizuhiki = $mizuhiki;

            return $this;
        }

        public function getSortNo()
        {
            return $this->sort_no;
        }

        public function setSortNo($sortNo)
        {
            $this->sort_no = (int) $sortNo;

            return $this;
        }

        public function isVisible()
        {
            return $this->visible;
        }

        public function setVisible($visible)
        {
            $this->visible = (bool) $visible;

            return $this;
        }
    }
}
`;

  F['Repository/NoshiTitleRepository.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Repository;

use Doctrine\Persistence\ManagerRegistry;
use Eccube\Repository\AbstractRepository;
use Plugin\DaikokuGift\Entity\NoshiTitle;

class NoshiTitleRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, NoshiTitle::class);
    }

    /**
     * 注文手続きの選択肢（表示するものを並び順に）
     *
     * @return array<string, string> 表書き => 表書き
     */
    public function getChoices()
    {
        $choices = [];
        foreach ($this->findBy(['visible' => true], ['sort_no' => 'ASC']) as $NoshiTitle) {
            $choices[$NoshiTitle->getName()] = $NoshiTitle->getName();
        }

        return $choices;
    }
}
`;

  F['Form/Type/Admin/ConfigType.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Form\Type\Admin;

use Eccube\Form\Type\ToggleSwitchType;
use Plugin\DaikokuGift\Entity\Config;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\Range;

class ConfigType extends AbstractType
{
    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('accept', ToggleSwitchType::class)
            ->add('name_max_length', IntegerType::class, [
                'constraints' => [
                    new NotBlank(),
                    new Range(['min' => 1, 'max' => 20]),
                ],
            ])
            ->add('guide_text', TextareaType::class, [
                'required' => false,
                'constraints' => [
                    new Length(['max' => 255]),
                ],
            ]);
    }

    /**
     * {@inheritdoc}
     */
    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Config::class,
        ]);
    }
}
`;

  F['Form/Type/Admin/NoshiTitleType.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Form\Type\Admin;

use Eccube\Form\Type\ToggleSwitchType;
use Plugin\DaikokuGift\Entity\NoshiTitle;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

class NoshiTitleType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', TextType::class, [
                'constraints' => [
                    new NotBlank(),
                    new Length(['max' => 50]),
                ],
            ])
            ->add('mizuhiki', ChoiceType::class, [
                'choices' => array_combine(NoshiTitle::MIZUHIKI, NoshiTitle::MIZUHIKI),
            ])
            ->add('visible', ToggleSwitchType::class);
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => NoshiTitle::class,
        ]);
    }
}
`;

  F['Controller/Admin/ConfigController.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Controller\Admin;

use Eccube\Controller\AbstractController;
use Plugin\DaikokuGift\Form\Type\Admin\ConfigType;
use Plugin\DaikokuGift\Repository\ConfigRepository;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ConfigController extends AbstractController
{
    /**
     * @var ConfigRepository
     */
    protected $configRepository;

    public function __construct(ConfigRepository $configRepository)
    {
        $this->configRepository = $configRepository;
    }

    /**
     * のし・ギフト › 基本設定（プラグイン一覧の「設定」もここ）
     *
     * @Route("/%eccube_admin_route%/daikoku_gift/config", name="daikoku_gift_admin_config")
     * @Template("@DaikokuGift/admin/config.twig")
     */
    public function index(Request $request)
    {
        $Config = $this->configRepository->get();
        $form = $this->createForm(ConfigType::class, $Config);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->entityManager->persist($Config);
            $this->entityManager->flush();
            $this->addSuccess('admin.common.save_complete', 'admin');

            return $this->redirectToRoute('daikoku_gift_admin_config');
        }

        return [
            'form' => $form->createView(),
        ];
    }
}
`;

  F['Controller/Admin/NoshiTitleController.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Controller\Admin;

use Eccube\Controller\AbstractController;
use Plugin\DaikokuGift\Entity\NoshiTitle;
use Plugin\DaikokuGift\Form\Type\Admin\NoshiTitleType;
use Plugin\DaikokuGift\Repository\NoshiTitleRepository;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

class NoshiTitleController extends AbstractController
{
    /**
     * @var NoshiTitleRepository
     */
    protected $noshiTitleRepository;

    public function __construct(NoshiTitleRepository $noshiTitleRepository)
    {
        $this->noshiTitleRepository = $noshiTitleRepository;
    }

    /**
     * のし・ギフト › 表書き一覧（登録・編集）
     *
     * @Route("/%eccube_admin_route%/daikoku_gift/noshi_title", name="daikoku_gift_admin_noshi_title")
     * @Route("/%eccube_admin_route%/daikoku_gift/noshi_title/{id}/edit", requirements={"id" = "\d+"}, name="daikoku_gift_admin_noshi_title_edit")
     * @Template("@DaikokuGift/admin/noshi_title.twig")
     */
    public function index(Request $request, $id = null)
    {
        if ($id) {
            $NoshiTitle = $this->noshiTitleRepository->find($id);
            if (!$NoshiTitle) {
                throw new NotFoundHttpException();
            }
        } else {
            $NoshiTitle = new NoshiTitle();
            $NoshiTitle->setSortNo($this->noshiTitleRepository->count([]) + 1);
        }

        $form = $this->createForm(NoshiTitleType::class, $NoshiTitle);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->entityManager->persist($NoshiTitle);
            $this->entityManager->flush();
            $this->addSuccess('admin.common.save_complete', 'admin');

            return $this->redirectToRoute('daikoku_gift_admin_noshi_title');
        }

        return [
            'form' => $form->createView(),
            'NoshiTitle' => $NoshiTitle,
            'NoshiTitles' => $this->noshiTitleRepository->findBy([], ['sort_no' => 'ASC']),
        ];
    }

    /**
     * @Route("/%eccube_admin_route%/daikoku_gift/noshi_title/{id}/delete", requirements={"id" = "\d+"}, name="daikoku_gift_admin_noshi_title_delete", methods={"DELETE"})
     */
    public function delete(Request $request, $id)
    {
        $this->isTokenValid();
        $NoshiTitle = $this->noshiTitleRepository->find($id);
        if ($NoshiTitle) {
            $this->entityManager->remove($NoshiTitle);
            $this->entityManager->flush();
            $this->addSuccess('admin.common.delete_complete', 'admin');
        }

        return $this->redirectToRoute('daikoku_gift_admin_noshi_title');
    }
}
`;

  F['Nav.php'] = String.raw`<?php

namespace Plugin\DaikokuGift;

use Eccube\Common\EccubeNav;

class Nav implements EccubeNav
{
    /**
     * 管理画面の左メニューに「のし・ギフト」
     *
     * @return array
     */
    public static function getNav()
    {
        return [
            'daikoku_gift' => [
                'name' => 'daikoku_gift.admin.nav',
                'icon' => 'fa-gift',
                'children' => [
                    'daikoku_gift_noshi_title' => [
                        'name' => 'daikoku_gift.admin.nav.noshi_title',
                        'url' => 'daikoku_gift_admin_noshi_title',
                    ],
                    'daikoku_gift_config' => [
                        'name' => 'daikoku_gift.admin.nav.config',
                        'url' => 'daikoku_gift_admin_config',
                    ],
                ],
            ],
        ];
    }
}
`;

  F['PluginManager.php'] = String.raw`<?php

namespace Plugin\DaikokuGift;

@@4
use Doctrine\ORM\EntityManagerInterface;
use Eccube\Entity\Csv;
use Eccube\Entity\Master\CsvType;
use Eccube\Entity\Shipping;
@@
use Eccube\Plugin\AbstractPluginManager;
use Plugin\DaikokuGift\Entity\Config;
use Plugin\DaikokuGift\Entity\NoshiTitle;
use Psr\Container\ContainerInterface;

class PluginManager extends AbstractPluginManager
{
    /** 表書きの初期データ [表書き, 水引] */
    private const TITLES = [
        ['御歳暮', '紅白蝶結び'],
        ['御礼', '紅白蝶結び'],
        ['御祝', '紅白蝶結び'],
        ['内祝', '紅白蝶結び'],
        ['粗品', '紅白蝶結び'],
        ['志', '黒白結び切り'],
    ];
@@4

    /** 配送CSV に足す項目 [お届け先のフィールド, 項目名] */
    private const CSV = [
        ['noshi_type_name', 'のし'],
        ['noshi_title', 'のし表書き'],
        ['noshi_name', 'のし名入れ'],
    ];
@@

    /**
     * 有効化：設定と表書きの初期データ（初回だけ）
     */
    public function enable(array $meta, ContainerInterface $container)
    {
        $em = $container->get('doctrine')->getManager();

        if (!$em->find(Config::class, 1)) {
            $em->persist(new Config());
        }
        if ($em->getRepository(NoshiTitle::class)->count([]) === 0) {
            foreach (self::TITLES as $i => [$name, $mizuhiki]) {
                $NoshiTitle = new NoshiTitle();
                $NoshiTitle->setName($name)->setMizuhiki($mizuhiki)->setSortNo($i + 1);
                $em->persist($NoshiTitle);
            }
        }
        $em->flush();
@@4
        $this->addCsv($em);
@@
    }
@@4

    /**
     * 無効化：配送CSV の項目を外す（お届け先の のし の列とデータは残る）
     */
    public function disable(array $meta, ContainerInterface $container)
    {
        $this->removeCsv($container->get('doctrine')->getManager());
    }

    /**
     * 削除：配送CSV の項目を外す（プラグインのテーブルは EC-CUBE が削除する）
     */
    public function uninstall(array $meta, ContainerInterface $container)
    {
        $this->removeCsv($container->get('doctrine')->getManager());
    }

    private function addCsv(EntityManagerInterface $em)
    {
        $CsvType = $em->find(CsvType::class, CsvType::CSV_TYPE_SHIPPING);
        $sortNo = (int) $em->createQuery('SELECT MAX(c.sort_no) FROM Eccube\Entity\Csv c WHERE c.CsvType = :type')
            ->setParameter('type', $CsvType)
            ->getSingleScalarResult();

        foreach (self::CSV as [$field, $label]) {
            if ($em->getRepository(Csv::class)->findOneBy(['CsvType' => $CsvType, 'field_name' => $field])) {
                continue;
            }
            $Csv = new Csv();
            $Csv->setCsvType($CsvType)
                ->setEntityName(Shipping::class)
                ->setFieldName($field)
                ->setDispName($label)
                ->setEnabled(true)
                ->setSortNo(++$sortNo)
                ->setCreateDate(new \DateTime())
                ->setUpdateDate(new \DateTime());
            $em->persist($Csv);
        }
        $em->flush();
    }

    private function removeCsv(EntityManagerInterface $em)
    {
        $CsvType = $em->find(CsvType::class, CsvType::CSV_TYPE_SHIPPING);
        foreach (self::CSV as [$field]) {
            $Csv = $em->getRepository(Csv::class)->findOneBy(['CsvType' => $CsvType, 'field_name' => $field]);
            if ($Csv) {
                $em->remove($Csv);
            }
        }
        $em->flush();
    }
@@
}
`;

  F['Resource/locale/messages.ja.yaml'] = `daikoku_gift.admin.nav: のし・ギフト
daikoku_gift.admin.nav.noshi_title: 表書き一覧
daikoku_gift.admin.nav.config: 基本設定
daikoku_gift.noshi: のし
daikoku_gift.noshi_enabled: のし対応
daikoku_gift.noshi_type.none: のしなし
daikoku_gift.noshi_title: 表書き
daikoku_gift.noshi_title.placeholder: 表書きを選択
daikoku_gift.noshi_title.required: のしの表書きを選択してください。
daikoku_gift.noshi_name: 名入れ
daikoku_gift.noshi_name.placeholder: 例）大黒
daikoku_gift.noshi_name.none: なし
daikoku_gift.noshi.items: 対象の商品：
`;

  F['Resource/template/admin/config.twig'] = `{% extends '@admin/default_frame.twig' %}

{% set menus = ['daikoku_gift', 'daikoku_gift_config'] %}

{% block title %}{{ 'daikoku_gift.admin.nav'|trans }}{% endblock %}
{% block sub_title %}{{ 'daikoku_gift.admin.nav.config'|trans }}{% endblock %}

{% form_theme form '@admin/Form/bootstrap_4_horizontal_layout.html.twig' %}

{% block main %}
    <form role="form" method="post">

        {{ form_widget(form._token) }}

        <div class="c-contentsArea__cols">
            <div class="c-contentsArea__primaryCol">
                <div class="c-primaryCol">
                    <div class="card rounded border-0 mb-4">
                        <div class="card-header"><span class="card-title">のし指定（注文手続き）</span></div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-3"><span>のし指定を受け付ける</span></div>
                                <div class="col">
                                    {{ form_widget(form.accept) }}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-3"><span>名入れの最大文字数</span><span class="badge bg-primary ms-1">必須</span></div>
                                <div class="col-2">
                                    {{ form_widget(form.name_max_length) }}
                                    {{ form_errors(form.name_max_length) }}
                                </div>
                                <div class="col-auto pt-2"><span>文字</span></div>
                            </div>
                            <div class="row">
                                <div class="col-3"><span>のし欄の案内</span></div>
                                <div class="col">
                                    {{ form_widget(form.guide_text, {'attr': {'rows': 3}}) }}
                                    {{ form_errors(form.guide_text) }}
                                    <small class="text-muted">注文手続きの「のし」の欄に表示します（のし対応の商品があるお届け先だけ）</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="c-conversionArea">
            <div class="c-conversionArea__container">
                <div class="row justify-content-between align-items-center">
                    <div class="col-6">
                        <div class="c-conversionArea__leftBlockItem">
                            <a class="c-baseLink"
                               href="{{ url('admin_store_plugin') }}">
                                <i class="fa fa-backward" aria-hidden="true"></i>
                                <span>プラグイン一覧</span>
                            </a>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="row align-items-center justify-content-end">
                            <div class="col-auto">
                                <button class="btn btn-ec-conversion px-5"
                                        type="submit">登録</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
{% endblock %}
`;

  F['Resource/template/admin/noshi_title.twig'] = `{% extends '@admin/default_frame.twig' %}

{% set menus = ['daikoku_gift', 'daikoku_gift_noshi_title'] %}

{% block title %}{{ 'daikoku_gift.admin.nav'|trans }}{% endblock %}
{% block sub_title %}{{ 'daikoku_gift.admin.nav.noshi_title'|trans }}{% endblock %}

{% form_theme form '@admin/Form/bootstrap_4_layout.html.twig' %}

{% block main %}
    <div class="c-contentsArea__cols">
        <div class="c-contentsArea__primaryCol">
            <div class="c-primaryCol">
                <div class="card rounded border-0 mb-4">
                    <div class="card-header"><span class="card-title">{{ NoshiTitle.id ? '表書きの編集' : '表書きの登録' }}</span></div>
                    <div class="card-body">
                        <form role="form" method="post" action="{{ NoshiTitle.id ? url('daikoku_gift_admin_noshi_title_edit', {id: NoshiTitle.id}) : url('daikoku_gift_admin_noshi_title') }}">
                            {{ form_widget(form._token) }}
                            <div class="row align-items-start">
                                <div class="col-3">
                                    <label class="form-label">表書き</label>
                                    {{ form_widget(form.name, {'attr': {'placeholder': '例）御年賀'}}) }}
                                    {{ form_errors(form.name) }}
                                </div>
                                <div class="col-3">
                                    <label class="form-label">水引</label>
                                    {{ form_widget(form.mizuhiki) }}
                                </div>
                                <div class="col-2">
                                    <label class="form-label">注文手続きに表示</label>
                                    {{ form_widget(form.visible) }}
                                </div>
                                <div class="col-auto pt-4 mt-2">
                                    <button class="btn btn-ec-regular px-4" type="submit">{{ NoshiTitle.id ? '保存' : '登録' }}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="card rounded border-0 mb-4">
                    <div class="card-header"><span class="card-title">{{ 'daikoku_gift.admin.nav.noshi_title'|trans }}（{{ NoshiTitles|length }} 件）</span></div>
                    <div class="card-body p-0">
                        <table class="table table-sm mb-0">
                            <thead>
                            <tr>
                                <th class="border-top-0 pt-2 pb-2 ps-3">表書き</th>
                                <th class="border-top-0 pt-2 pb-2">水引</th>
                                <th class="border-top-0 pt-2 pb-2">注文手続き</th>
                                <th class="border-top-0 pt-2 pb-2 pe-3"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {% for Title in NoshiTitles %}
                                <tr id="noshi-title-{{ Title.id }}">
                                    <td class="align-middle ps-3">{{ Title.name }}</td>
                                    <td class="align-middle">{{ Title.mizuhiki }}</td>
                                    <td class="align-middle">{{ Title.visible ? '表示' : '非表示' }}</td>
                                    <td class="align-middle pe-3 text-end">
                                        <a class="btn btn-ec-actionIcon" href="{{ url('daikoku_gift_admin_noshi_title_edit', {id: Title.id}) }}"><i class="fa fa-pencil fa-lg text-secondary"></i></a>
                                        <a class="btn btn-ec-actionIcon" href="{{ url('daikoku_gift_admin_noshi_title_delete', {id: Title.id}) }}" {{ csrf_token_for_anchor() }} data-method="delete" data-message="この表書きを削除してもよろしいですか？"><i class="fa fa-close fa-lg text-secondary"></i></a>
                                    </td>
                                </tr>
                            {% endfor %}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
{% endblock %}
`;

  /* ---------------------------------------------------------------- stage 2: the order side */
  F['Entity/ProductTrait.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Annotation\EntityExtension;
use Eccube\Annotation\FormAppend;

/**
 * 商品：のし対応（@FormAppend で商品登録の「基本情報」に入力欄が出る）
 *
 * @EntityExtension("Eccube\Entity\Product")
 */
trait ProductTrait
{
    /**
     * @var bool
     *
     * @ORM\Column(name="daikoku_noshi_enabled", type="boolean", options={"default":false})
     * @FormAppend(
     *     auto_render=true,
     *     type="\Symfony\Component\Form\Extension\Core\Type\CheckboxType",
     *     options={
     *         "required": false,
     *         "label": "daikoku_gift.noshi_enabled"
     *     }
     * )
     */
    private $noshi_enabled = false;

    public function isNoshiEnabled()
    {
        return (bool) $this->noshi_enabled;
    }

    public function setNoshiEnabled($noshiEnabled)
    {
        $this->noshi_enabled = (bool) $noshiEnabled;

        return $this;
    }
}
`;

  F['Entity/ShippingTrait.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Annotation\EntityExtension;

/**
 * お届け先：のし（注文手続き・受注登録で入力し、受注に残す）
 *
 * @EntityExtension("Eccube\Entity\Shipping")
 */
trait ShippingTrait
{
    /**
     * のしの種類（outer：外のし / inner：内のし / null：のしなし）
     *
     * @var string|null
     *
     * @ORM\Column(name="daikoku_noshi_type", type="string", length=10, nullable=true)
     */
    private $noshi_type;

    /**
     * 表書き（選んだときの文字のまま残す）
     *
     * @var string|null
     *
     * @ORM\Column(name="daikoku_noshi_title", type="string", length=50, nullable=true)
     */
    private $noshi_title;

    /**
     * 名入れ
     *
     * @var string|null
     *
     * @ORM\Column(name="daikoku_noshi_name", type="string", length=50, nullable=true)
     */
    private $noshi_name;

    public function getNoshiType()
    {
        return $this->noshi_type;
    }

    public function setNoshiType($noshiType)
    {
        $this->noshi_type = $noshiType;

        return $this;
    }

    /**
     * 外のし / 内のし（メール・CSV 用）
     */
    public function getNoshiTypeName()
    {
        return NoshiTitle::TYPES[$this->noshi_type] ?? null;
    }

    public function getNoshiTitle()
    {
        return $this->noshi_title;
    }

    public function setNoshiTitle($noshiTitle)
    {
        $this->noshi_title = $noshiTitle;

        return $this;
    }

    public function getNoshiName()
    {
        return $this->noshi_name;
    }

    public function setNoshiName($noshiName)
    {
        $this->noshi_name = $noshiName;

        return $this;
    }
}
`;

  F['Form/Extension/ShippingTypeExtension.php'] = String.raw`<?php

namespace Plugin\DaikokuGift\Form\Extension;

use Eccube\Entity\Shipping;
use Eccube\Form\Type\Admin\ShippingType as AdminShippingType; @@3
use Eccube\Form\Type\Shopping\ShippingType;
use Plugin\DaikokuGift\Entity\NoshiTitle;
use Plugin\DaikokuGift\Repository\ConfigRepository;
use Plugin\DaikokuGift\Repository\NoshiTitleRepository;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormError;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\Validator\Constraints\Length;

/**
 * お届け先のフォームに のし（種類・表書き・名入れ）
 */
class ShippingTypeExtension extends AbstractTypeExtension
{
    /**
     * @var ConfigRepository
     */
    protected $configRepository;

    /**
     * @var NoshiTitleRepository
     */
    protected $noshiTitleRepository;

    public function __construct(ConfigRepository $configRepository, NoshiTitleRepository $noshiTitleRepository)
    {
        $this->configRepository = $configRepository;
        $this->noshiTitleRepository = $noshiTitleRepository;
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $Config = $this->configRepository->get();

        $builder
            ->add('noshi_type', ChoiceType::class, [
                'required' => false,
                'placeholder' => 'daikoku_gift.noshi_type.none',
                'choices' => array_flip(NoshiTitle::TYPES),
            ])
            ->add('noshi_title', ChoiceType::class, [
                'required' => false,
                'placeholder' => 'daikoku_gift.noshi_title.placeholder',
                'choices' => $this->noshiTitleRepository->getChoices(),
            ])
            ->add('noshi_name', TextType::class, [
                'required' => false,
                'constraints' => [
                    new Length(['max' => $Config->getNameMaxLength()]),
                ],
            ])
            ->addEventListener(FormEvents::POST_SUBMIT, function (FormEvent $event) {
                /** @var Shipping $Shipping */
                $Shipping = $event->getData();
                if (!$Shipping->getNoshiType()) {
                    // のしなし：表書き・名入れは残さない
                    $Shipping->setNoshiTitle(null)->setNoshiName(null);
                } elseif (!$Shipping->getNoshiTitle()) {
                    $event->getForm()->get('noshi_title')->addError(new FormError(trans('daikoku_gift.noshi_title.required')));
                }
            });
    }

    public static function getExtendedTypes(): iterable
    {
        yield ShippingType::class;
        yield AdminShippingType::class; @@3
    }
}
`;

  F['Event.php'] = String.raw`<?php

namespace Plugin\DaikokuGift;

use Eccube\Event\TemplateEvent;
use Plugin\DaikokuGift\Repository\ConfigRepository;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class Event implements EventSubscriberInterface
{
    /**
     * @var ConfigRepository
     */
    protected $configRepository;

    public function __construct(ConfigRepository $configRepository)
    {
        $this->configRepository = $configRepository;
    }

    /**
     * @return array
     */
    public static function getSubscribedEvents()
    {
        return [
            'Shopping/index.twig' => 'onShoppingIndex',
            'Shopping/confirm.twig' => 'onShoppingConfirm',
            '@admin/Order/edit.twig' => 'onAdminOrderEdit', @@3
            'Mail/order.twig' => 'onMailOrder', @@3
        ];
    }

    /**
     * 注文手続き：お届け先ごとに「お届け時間」の下へ のし の入力欄
     */
    public function onShoppingIndex(TemplateEvent $event)
    {
        $event->setParameter('DaikokuGiftConfig', $this->configRepository->get());
        $this->insert($event, '{{ form_errors(form.Shippings[idx].DeliveryTime) }}', 3, "{{ include('@DaikokuGift/default/Shopping/noshi_form.twig') }}");
    }

    /**
     * ご注文内容のご確認：選んだ のし
     */
    public function onShoppingConfirm(TemplateEvent $event)
    {
        $this->insert($event, "{{ Order.Shippings[idx].shipping_delivery_time?: '指定なし'|trans }}", 3, "{{ include('@DaikokuGift/default/Shopping/noshi_confirm.twig') }}");
    }
@@3

    /**
     * 受注登録：お届け先の「お届け時間」の下に のし
     */
    public function onAdminOrderEdit(TemplateEvent $event)
    {
        $this->insert($event, '{{ form_errors(form.Shipping.DeliveryTime) }}', 2, "{{ include('@DaikokuGift/admin/order_noshi.twig') }}");
    }

    /**
     * 注文受付メール：お届け先ごとに「お届け時間」の次の行へ のし
     */
    public function onMailOrder(TemplateEvent $event)
    {
        $this->insert($event, "お届け時間：{{ Shipping.shipping_delivery_time|default('指定なし') }}", 0,
            "{% if Shipping.noshi_type %}\nのし：{{ Shipping.noshi_type_name }}・{{ Shipping.noshi_title }}{% if Shipping.noshi_name %}（名入れ：{{ Shipping.noshi_name }}）{% endif %}{% endif %}", '');
    }
@@

    /**
     * テンプレートの $needle の後ろ（閉じタグ </div> を $close 個進んだ所）に $twig を差し込む
     */
    private function insert(TemplateEvent $event, $needle, $close, $twig, $glue = "\n")
    {
        $source = $event->getSource();
        $pos = strpos($source, $needle);
        if ($pos === false) {
            return; // テンプレートが変わっていたら何もしない
        }
        $pos += strlen($needle);
        for ($i = 0; $i < $close; $i++) {
            $pos = strpos($source, '</div>', $pos) + strlen('</div>');
        }
        $event->setSource(substr($source, 0, $pos).$glue.$twig.substr($source, $pos));
    }
}
`;

  F['Resource/template/default/Shopping/noshi_form.twig'] = `{#
あみだ池大黒 ギフトのし：注文手続きのお届け先ごとの のし（Event::onShoppingIndex が「お届け時間」の下に差し込む）
#}
{% set noshiItems = shipping.productOrderItems|filter(item => item.Product.noshi_enabled) %}
{% if DaikokuGiftConfig.accept and noshiItems|length > 0 %}
    {% if idx == 0 %}
        <style>
            .ec-orderDelivery__noshi { margin: 4px 0 28px; padding: 16px 20px 6px; border: 1px solid #d8cdb4; border-radius: 4px; background: #fbf8f1; }
            .ec-orderDelivery__noshiTitle { font-weight: bold; margin-bottom: 6px; }
            .ec-orderDelivery__noshiGuide, .ec-orderDelivery__noshiItems { font-size: 13px; color: #666; margin: 0 0 10px; }
            .ec-orderDelivery__noshi .ec-input input { max-width: 260px; }
        </style>
    {% endif %}
    <div class="ec-orderDelivery__noshi" id="daikoku-noshi-{{ idx }}">
        <div class="ec-orderDelivery__noshiTitle">{{ 'daikoku_gift.noshi'|trans }}</div>
        {% if DaikokuGiftConfig.guide_text %}
            <p class="ec-orderDelivery__noshiGuide">{{ DaikokuGiftConfig.guide_text|nl2br }}</p>
        {% endif %}
        <div class="ec-selects">
            <div class="ec-select">
                <label>{{ 'daikoku_gift.noshi'|trans }}</label>
                {{ form_widget(form.Shippings[idx].noshi_type, {'attr': {'class': 'form-control'}}) }}
                {{ form_errors(form.Shippings[idx].noshi_type) }}
            </div>
            <div class="ec-select">
                <label>{{ 'daikoku_gift.noshi_title'|trans }}</label>
                {{ form_widget(form.Shippings[idx].noshi_title, {'attr': {'class': 'form-control'}}) }}
                {{ form_errors(form.Shippings[idx].noshi_title) }}
            </div>
            <div class="ec-input">
                <label>{{ 'daikoku_gift.noshi_name'|trans }}</label>
                {{ form_widget(form.Shippings[idx].noshi_name, {'attr': {'class': 'form-control', 'placeholder': 'daikoku_gift.noshi_name.placeholder'|trans}}) }}
                {{ form_errors(form.Shippings[idx].noshi_name) }}
            </div>
        </div>
        <p class="ec-orderDelivery__noshiItems">{{ 'daikoku_gift.noshi.items'|trans }}{{ noshiItems|map(item => item.product_name)|join('、') }}</p>
    </div>
{% else %}
    {% do form.Shippings[idx].noshi_type.setRendered %}
    {% do form.Shippings[idx].noshi_title.setRendered %}
    {% do form.Shippings[idx].noshi_name.setRendered %}
{% endif %}
`;

  F['Resource/template/default/Shopping/noshi_confirm.twig'] = `{#
あみだ池大黒 ギフトのし：ご注文内容のご確認（Event::onShoppingConfirm）
#}
{% set Shipping = Order.Shippings[idx] %}
{% if Shipping.noshi_type %}
    <div class="ec-orderDelivery__noshi" style="margin: 4px 0 24px; padding: 12px 20px; border: 1px solid #d8cdb4; border-radius: 4px; background: #fbf8f1;">
        <div class="ec-selects">
            <div class="ec-select">
                <label>{{ 'daikoku_gift.noshi'|trans }}</label>
                {{ Shipping.noshi_type_name }}・{{ Shipping.noshi_title }}
            </div>
            <div class="ec-select">
                <label>{{ 'daikoku_gift.noshi_name'|trans }}</label>
                {{ Shipping.noshi_name ?: 'daikoku_gift.noshi_name.none'|trans }}
            </div>
        </div>
    </div>
{% endif %}
`;

  /* ---------------------------------------------------------------- stage 3: 受注登録 */
  F['Resource/template/admin/order_noshi.twig'] = `{#
あみだ池大黒 ギフトのし：受注登録のお届け先（Event::onAdminOrderEdit）
#}
<div class="row mb-3">
    <label class="col-3 col-form-label"><i class="fa fa-gift fa-fw me-1" aria-hidden="true"></i>{{ 'daikoku_gift.noshi'|trans }}</label>
    <div class="col">
        <div class="row">
            <div class="col-5">{{ form_widget(form.Shipping.noshi_type) }}</div>
            <div class="col-7">{{ form_widget(form.Shipping.noshi_title) }}</div>
        </div>
        {{ form_errors(form.Shipping.noshi_title) }}
    </div>
</div>
<div class="row mb-3">
    <label class="col-3 col-form-label">{{ 'daikoku_gift.noshi_name'|trans }}</label>
    <div class="col">
        {{ form_widget(form.Shipping.noshi_name) }}
        {{ form_errors(form.Shipping.noshi_name) }}
    </div>
</div>
`;

  /** which stage each file comes in (the generated skeleton's files: 0) */
  const STAGE = {
    'composer.json': 0, 'TwigBlock.php': 0, 'Repository/ConfigRepository.php': 0, 'Resource/locale/validators.ja.yaml': 0, '.github/workflows/release.yml': 0,
    'Event.php': 0, 'Nav.php': 1, 'Entity/Config.php': 1, 'Form/Type/Admin/ConfigType.php': 1, 'Controller/Admin/ConfigController.php': 1,
    'Resource/template/admin/config.twig': 1, 'Resource/locale/messages.ja.yaml': 1,
    'Entity/NoshiTitle.php': 1, 'Repository/NoshiTitleRepository.php': 1, 'Form/Type/Admin/NoshiTitleType.php': 1,
    'Controller/Admin/NoshiTitleController.php': 1, 'Resource/template/admin/noshi_title.twig': 1, 'PluginManager.php': 1,
    'Entity/ProductTrait.php': 2, 'Entity/ShippingTrait.php': 2, 'Form/Extension/ShippingTypeExtension.php': 2,
    'Resource/template/default/Shopping/noshi_form.twig': 2, 'Resource/template/default/Shopping/noshi_confirm.twig': 2,
    'Resource/template/admin/order_noshi.twig': 3,
  };
  /** the stage the generated file is replaced by the plugin's own version */
  const REPLACED = { 'Event.php': 2 };

  /**
   * a file's text at a stage: a line ending in " @@N" only from stage N; lines between "@@N" and "@@" only from stage N
   */
  function staged(text, stage) {
    const out = [];
    let need = 0;
    for (const line of text.split('\n')) {
      const blk = /^@@(\d)?$/.exec(line);
      if (blk) { need = blk[1] ? +blk[1] : 0; continue; }
      if (need > stage) continue;
      const m = / @@(\d)$/.exec(line);
      if (m) { if (+m[1] <= stage) out.push(line.slice(0, m.index)); continue; }
      out.push(line);
    }
    return out.join('\n');
  }

  /** the plugin's text of a file at a stage (from the plugin root) */
  function source(rel, stage = 4) {
    const from = REPLACED[rel] || STAGE[rel] || 1;
    if (rel in F && stage >= from) return staged(F[rel], stage);
    return SCAFFOLD[rel];
  }

  return {
    PLUGIN: P,
    CODE: 'DaikokuGift',
    NAME: 'あみだ池大黒 ギフトのし',
    VERSION: '1.0.0',
    SCAFFOLD,
    STAGE,
    source,
    staged,
    /** the plugin's files at a stage (paths from the EC-CUBE root; stage 0: what the generator wrote) */
    files(stage) {
      const out = {};
      const names = new Set([...Object.keys(SCAFFOLD), ...Object.keys(STAGE)]);
      for (const rel of names) {
        const at = rel in SCAFFOLD ? 0 : STAGE[rel];
        if (at > stage) continue;
        const t = stage === 0 ? SCAFFOLD[rel] : source(rel, stage);
        if (t != null) out[P + rel] = t;
      }
      return out;
    },
    /** what the video's test order enters (the gift box and its のし) */
    TEST: { title: '御歳暮', name: '田中', type: 'outer' },
  };
});
