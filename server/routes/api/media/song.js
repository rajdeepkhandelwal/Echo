const co = require('co');
const { request } = require('../../../utils');
const convertLrcToJSON = require('../../../lib/convertLrcToJSON');

module.exports = function getSong(req, res, next) {
  const { name, id } = req.query;
  // TO DO: use async await when targeting node 8.0

  co(function *() {
    const html = yield request(`http://mp3.zing.vn/bai-hat/${name}/${id}.html`);
    const regex = /json\/song\/get-source\/.{24}/; // get the resouce url
    const match = html.match(regex);
    if (!match) throw new Error("can't find the resource URL");

    const [matchUrl] = match;
    const resource = yield request(`http://mp3.zing.vn/${matchUrl}`);
    const data = JSON.parse(resource).data[0];
    // data.lyric now is a url

    if (!data.lyric.trim()) {
      data.lyric = []; // rewrite the {string} url to an array
      return data;
    }

    const lrcFile = yield request(data.lyric);
    data.lyric = convertLrcToJSON(lrcFile);

    return data;
  })
  .then(data => res.json(data))
  .catch(err => next(err));
};