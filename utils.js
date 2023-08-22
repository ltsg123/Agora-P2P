const prefix = "👉";

// 日志
export function log(data) {
  console.log(
    `${prefix}${getTimestamp()}:[DC_SIGNAL_LOG]:${JSON.stringify(data)}`
  );
}

function getTimestamp() {
  const date = new Date();
  return date.toTimeString().split(" ")[0] + ":" + date.getMilliseconds();
}

// document.getElementById
export function $(id) {
  return document.getElementById(id);
}

export function createEl(tagName, body, id) {
  const tag = document.createElement(tagName);
  tag.id = id;
  body.appendChild(tag);
}

export async function post(url, options) {
  try {
    options = {
      timeout: options.timeout || 5000,
      responseType: options.responseType || "json",
      headers: options.headers || {},
      url,
      data: options.data,
    };
    options.headers["Content-Type"] =
      options.headers["Content-Type"] || "application/json";
    options.method = "POST";

    const result = await axios.request(options);
    return result;
  } catch (error) {
    console.error(error);
    return;
  }
}

export function getQueryVariable(variable) {
  const query = window.location.search.substring(1);
  const vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return false;
}
