=== MK Simple Live Search ===
Contributors: marstamyan
Tags: search, live search, shortcode, rest api
Requires at least: 6.2
Tested up to: 7.1.4
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add independent live search fields to WordPress pages with a shortcode.

== Description ==

Search published posts, pages and public searchable custom post types. Results appear after at least three characters. Supports multiple fields per page, keyboard navigation, accessible status messages and title/content search modes.

Only published content without a password is returned. Drafts, private posts and internal types are excluded, including for administrators. The public REST endpoint is read-only and requires no login. No data is sent to external services.

== Installation ==

1. Upload the plugin folder to /wp-content/plugins/ or upload the release ZIP through Plugins > Add New.
2. Activate MK Simple Live Search.
3. Add a Shortcode block to a page and paste [mk_simple_live_search].

== Frequently Asked Questions ==

= Which shortcodes are available? =

[mk_simple_live_search]
[mk_simple_live_search search_in="title"]
[mk_simple_live_search search_in="content"]
[mk_simple_live_search posts_per_page="5"]
[mk_simple_live_search post_type="portfolio"]
[mk_simple_live_search post_type="post,page"]

Options can be combined. Default result limit is 10; allowed range is 1 to 20. Queries are 3 to 100 characters. Custom post types must already exist, be public, publicly viewable and included in search.

= Can I use several fields on one page? =

Yes. Each field has independent settings and results.

= Does it search excerpts, custom fields, or make spelling corrections? =

No. The plugin uses native WordPress title/content search. Matching follows the site's database search behavior.

== Changelog ==

= 1.1.0 =
* Restrict results to public, published, unprotected content.
* Add strict REST validation and bounded result limits.
* Fix concurrent responses, cancellation, errors and plain permalink URLs.
* Support multiple search fields and keyboard navigation.
* Add translated strings, labels and live status messages.
* Limit admin CSS to the plugin page and load JavaScript for shortcodes.

= 1.0 =
* Initial release.
