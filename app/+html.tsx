import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no" />

        {/* 背景色防止闪烁 */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />

        {/* 修复 Web 端滚动和高度问题 */}
        <style dangerouslySetInnerHTML={{ __html: webFixStyles }} />

        {/* 手动加载图标字体，修复 tofu 方块问题 */}
        <style dangerouslySetInnerHTML={{ __html: iconFontStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #f0f8ff;
}
`;

// Web端修复：允许页面滚动，确保所有容器正确传递高度
const webFixStyles = `
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 确保根容器每层都有高度 */
#root > div,
#root > div > div,
#root > div > div > div {
  height: 100%;
  width: 100%;
}

/* 让 ScrollView 在 Web 端可以正常滚动 */
div[style*="overflow-y: scroll"],
div[style*="overflow-y: auto"] {
  -webkit-overflow-scrolling: touch;
}
`;

// 手动注入图标字体 @font-face
// 字体文件放在 public/fonts/ 目录下，打包后路径固定为 /fonts/
// 注意：@expo/vector-icons 在 Web 端使用的字体族名是小写的 material-community
const iconFontStyles = `
@font-face {
  font-family: 'material-community';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'material';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/MaterialIcons.ttf') format('truetype');
  font-display: block;
}
`;
