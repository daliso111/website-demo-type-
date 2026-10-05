-- Hilltop Construction: News & Foresight homepage cards and images.
-- Run after 202607130006_business_snapshot_video.sql.

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  article_key uuid not null default gen_random_uuid(),
  record_type text not null default 'draft' check(record_type in ('draft','published')),
  category text,
  title text not null default '',
  summary text,
  publication_date date,
  image_asset_id uuid references public.media_assets(id) on delete set null,
  image_alt text,
  article_url text,
  is_featured boolean not null default false,
  sort_order integer not null default 0 check(sort_order >= 0),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(article_key,record_type)
);

create index if not exists news_articles_record_order_idx on public.news_articles(record_type,sort_order);
create index if not exists news_articles_image_asset_idx on public.news_articles(image_asset_id);
create index if not exists news_articles_publication_date_idx on public.news_articles(publication_date desc);

create or replace function private.set_news_article_audit_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=now();
  new.updated_by=(select auth.uid());
  if tg_op='INSERT' then new.created_by=coalesce(new.created_by,(select auth.uid())); end if;
  if new.record_type='draft' then new.published_at=null; end if;
  return new;
end;
$$;

drop trigger if exists set_news_article_audit_fields on public.news_articles;
create trigger set_news_article_audit_fields before insert or update on public.news_articles
for each row execute function private.set_news_article_audit_fields();

create or replace function public.publish_news_articles()
returns setof public.news_articles
language plpgsql security invoker set search_path='' as $$
declare invalid_article text; draft_count integer; visible_count integer;
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;

  select count(*),count(*) filter(where is_visible)
    into draft_count,visible_count
    from public.news_articles where record_type='draft';
  if draft_count=0 or visible_count=0 then
    raise exception 'At least one visible News & Foresight draft is required';
  end if;

  select coalesce(nullif(btrim(title),''),article_key::text) into invalid_article
  from public.news_articles
  where record_type='draft' and is_visible and (
    nullif(btrim(category),'') is null
    or nullif(btrim(title),'') is null
    or nullif(btrim(summary),'') is null
    or image_asset_id is null
    or nullif(btrim(image_alt),'') is null
    or length(btrim(image_alt))<5
    or nullif(btrim(article_url),'') is null
    or article_url !~ '^(#[^[:space:]]+|[A-Za-z][A-Za-z0-9+.-]*:[^[:space:]]+)$'
    or not exists(
      select 1 from public.media_assets m
      where m.id=news_articles.image_asset_id
        and m.media_type='image'
        and m.mime_type in ('image/jpeg','image/png','image/webp','image/avif')
    )
  ) limit 1;
  if invalid_article is not null then
    raise exception 'News article "%" is incomplete or invalid',invalid_article;
  end if;

  if exists(
    select 1 from public.news_articles
    where record_type='draft'
    group by sort_order having count(*)>1
  ) then raise exception 'News article ordering contains duplicates'; end if;

  delete from public.news_articles p
  where p.record_type='published' and not exists(
    select 1 from public.news_articles d
    where d.record_type='draft' and d.article_key=p.article_key
  );

  insert into public.news_articles(
    article_key,record_type,category,title,summary,publication_date,image_asset_id,image_alt,
    article_url,is_featured,sort_order,is_visible,published_at,created_by,updated_by
  )
  select
    article_key,'published',category,title,summary,publication_date,image_asset_id,image_alt,
    article_url,is_featured,sort_order,is_visible,now(),created_by,auth.uid()
  from public.news_articles where record_type='draft'
  on conflict(article_key,record_type) do update set
    category=excluded.category,title=excluded.title,summary=excluded.summary,
    publication_date=excluded.publication_date,image_asset_id=excluded.image_asset_id,
    image_alt=excluded.image_alt,article_url=excluded.article_url,is_featured=excluded.is_featured,
    sort_order=excluded.sort_order,is_visible=excluded.is_visible,
    published_at=excluded.published_at,updated_by=excluded.updated_by;

  return query select * from public.news_articles
    where record_type='published' order by sort_order,publication_date desc nulls last;
end;
$$;

create or replace function public.unpublish_news_articles()
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not (select private.is_active_homepage_admin()) then raise exception 'Not authorized'; end if;
  update public.news_articles set is_visible=false where record_type='published';
end;
$$;

alter table public.news_articles enable row level security;

drop policy if exists "Public can read visible published News articles" on public.news_articles;
create policy "Public can read visible published News articles" on public.news_articles for select to anon,authenticated
using((record_type='published' and is_visible=true) or (select private.is_active_homepage_admin()));
drop policy if exists "Active editors can insert News articles" on public.news_articles;
create policy "Active editors can insert News articles" on public.news_articles for insert to authenticated
with check((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can update News articles" on public.news_articles;
create policy "Active editors can update News articles" on public.news_articles for update to authenticated
using((select private.is_active_homepage_admin())) with check((select private.is_active_homepage_admin()));
drop policy if exists "Active editors can delete News articles" on public.news_articles;
create policy "Active editors can delete News articles" on public.news_articles for delete to authenticated
using((select private.is_active_homepage_admin()));

revoke all on public.news_articles from anon,authenticated;
grant select on public.news_articles to anon,authenticated;
grant insert,update,delete on public.news_articles to authenticated;
revoke all on function public.publish_news_articles() from public;
revoke all on function public.unpublish_news_articles() from public;
grant execute on function public.publish_news_articles() to authenticated;
grant execute on function public.unpublish_news_articles() to authenticated;

drop policy if exists "Public can retrieve News & Foresight images" on storage.objects;
drop policy if exists "Active editors can upload News & Foresight images" on storage.objects;
drop policy if exists "Active editors can update News & Foresight images" on storage.objects;
drop policy if exists "Active editors can delete News & Foresight images" on storage.objects;
create policy "Public can retrieve News & Foresight images" on storage.objects for select to anon,authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='news-foresight' and (storage.foldername(name))[2]='images');
create policy "Active editors can upload News & Foresight images" on storage.objects for insert to authenticated
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='news-foresight' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));
create policy "Active editors can update News & Foresight images" on storage.objects for update to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='news-foresight' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()))
with check(bucket_id='homepage-media' and (storage.foldername(name))[1]='news-foresight' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));
create policy "Active editors can delete News & Foresight images" on storage.objects for delete to authenticated
using(bucket_id='homepage-media' and (storage.foldername(name))[1]='news-foresight' and (storage.foldername(name))[2]='images' and (select private.is_active_homepage_admin()));

drop policy if exists "Active admins can delete media metadata" on public.media_assets;
create policy "Active admins can delete media metadata" on public.media_assets for delete to authenticated
using((select private.is_active_homepage_admin()) and not exists(
  select 1 from public.hero_settings h where h.background_video_asset_id=media_assets.id or h.poster_asset_id=media_assets.id
) and not exists(
  select 1 from public.featured_projects p where p.image_asset_id=media_assets.id
) and not exists(
  select 1 from public.business_snapshot_settings s where s.background_video_asset_id=media_assets.id or s.poster_asset_id=media_assets.id
) and not exists(
  select 1 from public.news_articles n where n.image_asset_id=media_assets.id
));
