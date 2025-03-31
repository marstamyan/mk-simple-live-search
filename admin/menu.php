<?php
function mk_simple_live_search_add_admin_menu() {
	add_menu_page(
		'Simple Live Search',
		'Live Search Info',
		'manage_options',
		'mk-simple-live-search-info',
		'mk_simple_live_search_info_page',
		'dashicons-search',
		90
	);
}
add_action( 'admin_menu', 'mk_simple_live_search_add_admin_menu' );

function mk_simple_live_search_info_page() {
	?>
	<div class="mk-simple-wrap">
		<h1 class="mk-simple-title">Simple Live Search - Usage Instructions</h1>
		<p class="mk-simple-description">This plugin allows you to add a live search field to your website using shortcodes.
		</p>

		<h2 class="mk-simple-subtitle">Available Shortcodes</h2>
		<p class="mk-simple-paragraph">Insert one of the following shortcodes into any page or post to enable live search:
		</p>
		<ul class="mk-simple-shortcodes-list">
			<li class="mk-simple-shortcode-item"><code>[mk_simple_live_search]</code> - Default search (titles and content).
			</li>
			<li class="mk-simple-shortcode-item"><code>[mk_simple_live_search search_in="title"]</code> - Search only in
				post titles.</li>
			<li class="mk-simple-shortcode-item"><code>[mk_simple_live_search search_in="content"]</code> - Search only in
				post content.</li>
			<li class="mk-simple-shortcode-item"><code>[mk_simple_live_search posts_per_page="5"]</code> - Limit results to
				5 items.</li>
			<li class="mk-simple-shortcode-item"><code>[mk_simple_live_search post_type="portfolio"]</code> Search through
				custom post type.</li>
		</ul>

		<h2 class="mk-simple-subtitle">How to Use</h2>
		<p class="mk-simple-paragraph">Simply place the desired shortcode inside any page, post, or widget to display the
			live search bar.</p>

		<br>
		<b class="mk-simple-warning"><u>⚠️ Only one search field can be used on the page. Using multiple search fields may
				cause incorrect behavior.</u></b>
	</div>
	<?php
}
