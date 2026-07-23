import os

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, render_template, abort, request, jsonify

from data.articles import (
    get_all_articles,
    get_article_by_slug,
    get_categories,
    get_related_articles,
)
from data.tools import get_all_tools, get_tool, get_tool_categories
from data.donate import donate_context
from data.community import community_page_context
from data.testimonials import testimonials_context
from data.sheets import append_review, fetch_reviews, sheets_configured, config_status

app = Flask(__name__)


@app.after_request
def cors_api(resp):
    if request.path.startswith("/api/passfill/"):
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/services", methods=["GET"])
def services():
    return render_template("services.html")


@app.route("/articles", methods=["GET"])
def articles():
    return render_template(
        "articles.html",
        articles=get_all_articles(),
        categories=get_categories(),
    )


@app.route("/articles/<slug>", methods=["GET"])
def article_detail(slug):
    article = get_article_by_slug(slug)
    if not article:
        abort(404)
    related = get_related_articles(slug)
    return render_template("article.html", article=article, related=related)


@app.route("/tools", methods=["GET"])
def tools():
    return render_template(
        "tools/index.html",
        tools=get_all_tools(),
        categories=get_tool_categories(),
    )


@app.route("/vault", methods=["GET"])
@app.route("/passfill", methods=["GET"])
def vault():
    ctx = donate_context()
    ctx.update(community_page_context())
    ctx.update(testimonials_context())
    return render_template("vault.html", **ctx)


@app.route("/tools/<slug>", methods=["GET"])
def tool_detail(slug):
    tool = get_tool(slug)
    if not tool:
        abort(404)
    return render_template(
        tool["template"],
        tool=tool,
        tools=get_all_tools(),
    )


@app.route("/api/passfill/reviews", methods=["GET", "POST", "OPTIONS"])
def api_passfill_reviews():
    if request.method == "OPTIONS":
        return ("", 204)

    if request.method == "GET":
        st = config_status()
        if not st["configured"]:
            return jsonify({
                "ok": False,
                "error": "sheets not configured",
                "config": st,
                "reviews": [],
            }), 503
        try:
            reviews = fetch_reviews(include_pending=False)
            return jsonify({"ok": True, "reviews": reviews, "count": len(reviews)})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e), "reviews": []}), 500

    st = config_status()
    if not st["configured"]:
        missing = []
        if not st["spreadsheet_id"]:
            missing.append("SPREADSHEET_ID")
        if not st["service_account_env"] and not st["credentials_file"]:
            missing.append("credentials.json or GOOGLE_SERVICE_ACCOUNT_JSON")
        return jsonify({
            "ok": False,
            "error": "Reviews backend not configured. Missing: " + ", ".join(missing),
            "config": st,
        }), 503

    data = request.get_json(silent=True) or {}
    name = data.get("name") or "Anon"
    rating = data.get("rating")
    body = data.get("body") or data.get("message") or ""

    ok, err = append_review(name, rating, body, status="approved")
    if not ok:
        code = 400 if err and ("rating" in err.lower() or "short" in err.lower()) else 502
        return jsonify({"ok": False, "error": err or "save failed"}), code

    reviews = fetch_reviews(include_pending=False)
    return jsonify({
        "ok": True,
        "message": "Review saved.",
        "reviews": reviews,
        "count": len(reviews),
    }), 201


@app.route("/api/passfill/sheets-status", methods=["GET"])
def api_sheets_status():
    return jsonify({"ok": True, "config": config_status()})


@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
