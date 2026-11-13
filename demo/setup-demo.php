<?php
/** Seed tutorial content. Run with `wp eval-file` ONLY on a disposable local site. */
if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) { exit( 'Run with WP-CLI on a disposable site.' ); }
if ( ! shortcode_exists( 'mk_simple_live_search' ) || ! post_type_exists( 'portfolio' ) ) {
    WP_CLI::error( 'Activate MK Simple Live Search and install demo/portfolio-type.php as a mu-plugin first.' );
}
function mk_live_demo_post( $slug, $title, $content, $type = 'post', $extra = array() ) {
    $old = get_page_by_path( $slug, OBJECT, $type );
    $id = wp_insert_post( array_merge( array(
        'ID' => $old ? $old->ID : 0,
        'post_name' => $slug, 'post_title' => $title, 'post_content' => $content,
        'post_type' => $type, 'post_status' => 'publish', 'post_author' => get_current_user_id(),
    ), $extra ), true );
    if ( is_wp_error( $id ) ) { WP_CLI::error( $id->get_error_message() ); }
    return $id;
}
mk_live_demo_post( 'coffee-guide', 'кофе: как выбрать зерно', 'Практический гид: обжарка, происхождение и помол.' );
mk_live_demo_post( 'coffee-recipes', 'кофе: три рецепта для дома', 'Готовим эспрессо, капучино и фильтр.' );
mk_live_demo_post( 'coffee-tools', 'кофе: оборудование для начинающих', 'Кофемолка, весы и чайник для домашней кухни.' );
mk_live_demo_post( 'home-guide', 'Домашние напитки', 'В статье слово кофе находится только в содержимом.' );
mk_live_demo_post( 'coffee-private', 'кофе: приватная заметка', 'Не должна появляться в публичном поиске.', 'post', array( 'post_status' => 'private' ) );
mk_live_demo_post( 'coffee-draft', 'кофе: черновик', 'Не должен появляться в публичном поиске.', 'post', array( 'post_status' => 'draft' ) );
mk_live_demo_post( 'coffee-password', 'кофе: под паролем', 'Не должен появляться в публичном поиске.', 'post', array( 'post_password' => 'demo-only' ) );
mk_live_demo_post( 'coffee-brand', 'кофе: фирменный стиль', 'Дизайн упаковки для локальной кофейни.', 'portfolio' );
mk_live_demo_post( 'bakery-brand', 'Пекарня: фирменный стиль', 'Сайт и айдентика семейной пекарни.', 'portfolio' );
$pages = array();
$pages['default'] = mk_live_demo_post( 'live-search', 'Живой поиск на сайте', '<p>Добавьте шорткод в страницу — посетители увидят результаты во время ввода.</p><pre>&#91;mk_simple_live_search&#93;</pre><p>Введите название напитка (минимум 3 символа).</p>[mk_simple_live_search]', 'page' );
$pages['modes'] = mk_live_demo_post( 'search-modes', 'Заголовки или содержимое', '<p>Один и тот же запрос даёт разные результаты в зависимости от выбранного режима.</p><h2>Только заголовки</h2><pre>&#91;mk_simple_live_search search_in="title"&#93;</pre>[mk_simple_live_search search_in="title"]<h2>Только содержимое</h2><pre>&#91;mk_simple_live_search search_in="content"&#93;</pre>[mk_simple_live_search search_in="content"]', 'page' );
$pages['options'] = mk_live_demo_post( 'search-options', 'Лимит и тип записи', '<h2>Не более двух результатов</h2><pre>&#91;mk_simple_live_search posts_per_page="2"&#93;</pre>[mk_simple_live_search posts_per_page="2"]<h2>Поиск по портфолио</h2><pre>&#91;mk_simple_live_search post_type="portfolio"&#93;</pre><p>Тип portfolio заранее зарегистрирован на этом тестовом сайте.</p>[mk_simple_live_search post_type="portfolio"]', 'page' );
$pages['editor'] = mk_live_demo_post( 'search-tutorial', 'Поиск по сайту', '<!-- wp:paragraph --><p>Поиск по опубликованным записям и страницам.</p><!-- /wp:paragraph -->' . "\n" . '<!-- wp:shortcode -->[mk_simple_live_search]<!-- /wp:shortcode -->', 'page' );
WP_CLI::success( wp_json_encode( $pages ) );
