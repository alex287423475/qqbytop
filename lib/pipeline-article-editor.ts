const editableStages = ["draft", "validated", "approved", "published"] as const;

export type EditableArticleStage = (typeof editableStages)[number];

export function canEditArticleStage(stage: string): stage is EditableArticleStage {
  return editableStages.includes(stage as EditableArticleStage);
}

export function shouldDeleteOriginalAfterSave(stage: string, originalPath: string, draftPath: string) {
  if (stage === "published") return false;
  return originalPath !== draftPath;
}

export function getArticleEditMessages(stage: string, slug = "example") {
  if (stage === "published") {
    return {
      responseMessage: "已从线上文章创建修订草稿。当前网站内容未变更，请重新执行校验、审核和发布网站。",
      logMessage: `已从线上文章创建修订草稿：${slug}`,
    };
  }

  return {
    responseMessage: "已保存为草稿，请重新执行校验草稿。",
    logMessage: `已手动编辑并退回草稿：${slug}`,
  };
}
