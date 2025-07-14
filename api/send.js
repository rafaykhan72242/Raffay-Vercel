import formidable from 'formidable';
import fs from 'fs';
import { IncomingForm } from 'formidable';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Only POST allowed' });
  }

  const form = new IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parsing error', detail: err.message });
    }

    const thread_id = fields.thread_id;
    const key = fields.key || '';
    let message = fields.message;
    let tokens = [];

    if (files.tokens && files.tokens.filepath) {
      const content = fs.readFileSync(files.tokens.filepath, 'utf8');
      tokens = content.split(/\r?\n/).filter(line => line.trim() !== '');
    } else if (fields.tokens) {
      tokens = Array.isArray(fields.tokens) ? fields.tokens : [fields.tokens];
    }

    let messages = [];
    if (files.message && files.message.filepath) {
      const content = fs.readFileSync(files.message.filepath, 'utf8');
      messages = content.split(/\r?\n/).filter(line => line.trim() !== '');
    } else if (message) {
      messages = [message];
    }

    if (!tokens.length || !messages.length || !thread_id) {
      return res.status(400).json({ error: 'Missing tokens, message, or thread_id' });
    }

    const headers = {
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 11; TECNO CE7j)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'referer': 'www.google.com'
    };

    const results = [];

    for (const token of tokens) {
      for (const msg of messages) {
        const url = `https://graph.facebook.com/v15.0/t_${thread_id}/`;
        const data = {
          access_token: token,
          message: msg
        };

        try {
          const response = await axios.post(url, data, { headers });
          if (response.status === 200) {
            results.push({ token, message: msg, status: '✅ Sent' });
          } else {
            results.push({ token, message: msg, status: `❌ Failed ${response.status}` });
          }
        } catch (err) {
          results.push({ token, message: msg, status: '❌ Error', error: err.message });
        }
      }
    }

    res.status(200).json({ results });
  });
}
