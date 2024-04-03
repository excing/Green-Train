import { FirebaseCredentialsURL } from "$env/static/private";

// firebase access token list
export function tokenList(result) {
  const regex = /{{(.*?)}}/g;
  let matches = [];
  let match;
  while ((match = regex.exec(result)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

// 检查 token 是否在查询结果内
export function checkHaveTokenInResult(token, result) {
  const regex = /{{(.*?)}}/g;
  let match = null;
  while ((match = regex.exec(result)) !== null) {
    if (token === match[1]) return true;
  }
  return false;
}
