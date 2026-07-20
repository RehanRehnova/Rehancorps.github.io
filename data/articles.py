"""
Markdown article pipeline (same idea as securiti):
- Drop .md files in content/posts/
- YAML frontmatter + markdown body
- Loaded at request time via python-frontmatter + markdown
"""
import os
from datetime import datetime

import frontmatter
import markdown

# Resolve relative to project root (parent of data/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_DIR = os.path.join(BASE_DIR, 'content', 'posts')

MD_EXTENSIONS = ['fenced_code', 'tables', 'nl2br', 'codehilite', 'sane_lists']


def _parse_date(value):
    if isinstance(value, datetime):
        return value
    if value is None:
        return datetime.min
    s = str(value).strip()
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%b %d, %Y', '%d %b %Y'):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return datetime.min


def _format_date(dt):
    if not isinstance(dt, datetime) or dt == datetime.min:
        return ''
    return dt.strftime('%b %d, %Y')


def _load_post(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)

    if post.get('draft', False):
        return None

    raw_date = post.get('date')
    dt = _parse_date(raw_date)

    html_content = markdown.markdown(
        post.content,
        extensions=MD_EXTENSIONS,
        extension_configs={
            'codehilite': {
                'css_class': 'highlight',
                'guess_lang': True,
            }
        },
    )

    slug = post.get('slug') or os.path.splitext(os.path.basename(filepath))[0]

    return {
        'slug': slug,
        'title': post.get('title', slug),
        'date': _format_date(dt),
        'date_sort': dt,
        'category': post.get('category', 'Ops'),
        'excerpt': post.get('excerpt', ''),
        'content': html_content,
        'thumbnail': post.get('thumbnail', ''),
        'author': post.get('author', 'Rehan'),
        'author_role': post.get('author_role', 'Offensive Operator'),
        'tags': post.get('tags', []) or [],
        'read_time': post.get('read_time', '5 min read'),
        'featured': bool(post.get('featured', False)),
    }


def get_all_articles():
    articles = []

    if not os.path.isdir(POSTS_DIR):
        return articles

    for filename in os.listdir(POSTS_DIR):
        if not filename.endswith('.md'):
            continue
        filepath = os.path.join(POSTS_DIR, filename)
        try:
            article = _load_post(filepath)
            if article:
                articles.append(article)
        except Exception as e:
            print(f'Error loading {filename}: {e}')
            continue

    return sorted(articles, key=lambda a: a['date_sort'], reverse=True)


def get_article_by_slug(slug):
    return next((a for a in get_all_articles() if a['slug'] == slug), None)


def get_categories():
    return sorted({a['category'] for a in get_all_articles() if a.get('category')})


def get_related_articles(current_slug, limit=3):
    current = get_article_by_slug(current_slug)
    if not current:
        return []
    related = [
        a for a in get_all_articles()
        if a['slug'] != current_slug and a.get('category') == current.get('category')
    ]
    if len(related) < limit:
        others = [
            a for a in get_all_articles()
            if a['slug'] != current_slug and a not in related
        ]
        related.extend(others)
    return related[:limit]
