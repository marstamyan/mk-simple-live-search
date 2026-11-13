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
mk_live_demo_post( 'coffee-guide', 'Coffee: choosing your beans', 'A guide to roasting, origins and grinding.' );
mk_live_demo_post( 'coffee-recipes', 'Coffee: three recipes to try', 'Make espresso, cappuccino and filter drinks.' );
mk_live_demo_post( 'coffee-tools', 'Coffee: equipment for beginners', 'Grinders, scales and kettles for beginners.' );
mk_live_demo_post( 'home-guide', 'Homemade drinks', 'This article mentions coffee only in its content.' );
mk_live_demo_post( 'coffee-private', 'Coffee: private note', 'Excluded from public search.', 'post', array( 'post_status' => 'private' ) );
mk_live_demo_post( 'coffee-draft', 'Coffee: draft', 'Excluded from public search.', 'post', array( 'post_status' => 'draft' ) );
mk_live_demo_post( 'coffee-password', 'Coffee: password protected', 'Excluded from public search.', 'post', array( 'post_password' => 'demo-only' ) );
mk_live_demo_post( 'coffee-brand', 'Coffee: brand identity', 'Packaging design for a local cafe.', 'portfolio' );
mk_live_demo_post( 'bakery-brand', 'Bakery: brand identity', 'Website and identity for a family bakery.', 'portfolio' );
$pages = array();
$pages['default'] = mk_live_demo_post( 'live-search', 'Live search on your site', '<p>Add a shortcode. Visitors see results as they type.</p><pre>&#91;mk_simple_live_search&#93;</pre><p>Type coffee to search (at least 3 characters).</p>[mk_simple_live_search]', 'page' );
$pages['modes'] = mk_live_demo_post( 'search-modes', 'Titles or content', '<p>The same query can return different results in each mode.</p><h2>Titles only</h2><pre>&#91;mk_simple_live_search search_in="title"&#93;</pre>[mk_simple_live_search search_in="title"]<h2>Content only</h2><pre>&#91;mk_simple_live_search search_in="content"&#93;</pre>[mk_simple_live_search search_in="content"]', 'page' );
$pages['options'] = mk_live_demo_post( 'search-options', 'Result limit and post type', '<h2>Up to two results</h2><pre>&#91;mk_simple_live_search posts_per_page="2"&#93;</pre>[mk_simple_live_search posts_per_page="2"]<h2>Search your portfolio</h2><pre>&#91;mk_simple_live_search post_type="portfolio"&#93;</pre><p>The portfolio post type is already registered on this site.</p>[mk_simple_live_search post_type="portfolio"]', 'page' );
$pages['editor'] = mk_live_demo_post( 'search-tutorial', 'Site search', '<!-- wp:paragraph --><p>Search published posts and pages.</p><!-- /wp:paragraph -->' . "\n" . '<!-- wp:shortcode -->[mk_simple_live_search]<!-- /wp:shortcode -->', 'page' );
WP_CLI::success( wp_json_encode( $pages ) );
