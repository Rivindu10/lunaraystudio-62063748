<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store multiple booking slots as pipe-separated labels in preferred_time; split them for interval comparisons so existing dashboard and notification display remain compatible.
- Use the shared site-image registry and SiteImage for public photographs; store administrator replacements in site_photos with original bundled assets as fallbacks, so existing and bundled collection images remain replaceable without source edits.
