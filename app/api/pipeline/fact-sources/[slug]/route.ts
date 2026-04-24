import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { readKeywordRows } from "@/lib/pipeline-keywords";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const factSourcesDir = path.join(process.cwd(), "local-brain", "inputs", "fact-sources");

function assertDevOnly() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Fact source editor is disabled in production." }, { status: 403 });
  }

  return null;
}

function getFactSourcePath(slug: string) {
  return path.join(factSourcesDir, `${slug}.md`);
}

function getKeyword(slug: string) {
  return readKeywordRows().find((row) => row.slug === slug) || null;
}

function buildDefaultPack(slug: string) {
  const keyword = getKeyword(slug);
  const title = keyword?.keyword || slug;

  return `# ${title} 事实源资料包

## 核心结论
- 

## 适用场景
- 

## 不适用场景
- 

## 脱敏案例
| 原始情况 | 风险点 | 建议处理 |
| --- | --- | --- |
|  |  |  |

## 常见错误与修正
| 常见错误 | 接收方可能如何理解 | 建议修正 |
| --- | --- | --- |
|  |  |  |

## 证据或材料清单
- 

## 术语与表达标准
| 中文/原表达 | 推荐译法/写法 | 说明 |
| --- | --- | --- |
|  |  |  |

## 外部来源与备注
- 

## 禁止编造
- 不要编造成功率、客户名称、政策日期、法规条款编号。
- 没有证据的数据只能写成“常见情况”“项目中经常遇到的情况”。
`;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const { slug } = await context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ message: "Invalid slug." }, { status: 400 });

  const filePath = getFactSourcePath(slug);
  const exists = fs.existsSync(filePath);

  return NextResponse.json({
    slug,
    stage: exists ? "fact-source-pack" : "fact-source-template",
    editable: true,
    filePath,
    markdown: exists ? fs.readFileSync(filePath, "utf-8") : buildDefaultPack(slug),
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const blocked = assertDevOnly();
  if (blocked) return blocked;

  const { slug } = await context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ message: "Invalid slug." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { markdown?: string };
  const markdown = typeof body.markdown === "string" ? body.markdown.trimEnd() : "";
  if (!markdown.trim()) return NextResponse.json({ message: "事实源资料包不能为空。" }, { status: 400 });

  fs.mkdirSync(factSourcesDir, { recursive: true });
  const filePath = getFactSourcePath(slug);
  fs.writeFileSync(filePath, `${markdown}\n`, "utf-8");

  return NextResponse.json({
    success: true,
    slug,
    stage: "fact-source-pack",
    editable: true,
    filePath,
    markdown: `${markdown}\n`,
  });
}
