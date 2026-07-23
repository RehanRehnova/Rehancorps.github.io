from flask import Flask, render_template, abort

from data.articles import (
    get_all_articles,
    get_article_by_slug,
    get_categories,
    get_related_articles,
)
from data.tools import get_all_tools, get_tool, get_tool_categories
from data.donate import donate_context

app = Flask(__name__)


@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


@app.route('/services', methods=['GET'])
def services():
    return render_template('services.html')


@app.route('/articles', methods=['GET'])
def articles():
    return render_template(
        'articles.html',
        articles=get_all_articles(),
        categories=get_categories(),
    )


@app.route('/articles/<slug>', methods=['GET'])
def article_detail(slug):
    article = get_article_by_slug(slug)
    if not article:
        abort(404)
    related = get_related_articles(slug)
    return render_template('article.html', article=article, related=related)


@app.route('/tools', methods=['GET'])
def tools():
    return render_template(
        'tools/index.html',
        tools=get_all_tools(),
        categories=get_tool_categories(),
    )


@app.route('/vault', methods=['GET'])
@app.route('/passfill', methods=['GET'])
def vault():
    """REHNOVA Passfill — free download + install (Chrome / Firefox / Edge)."""
    return render_template('vault.html', **donate_context())


@app.route('/tools/<slug>', methods=['GET'])
def tool_detail(slug):
    tool = get_tool(slug)
    if not tool:
        abort(404)
    return render_template(
        tool['template'],
        tool=tool,
        tools=get_all_tools(),
    )


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
