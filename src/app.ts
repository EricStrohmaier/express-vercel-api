import express from 'express';
import cors from 'cors';
// eslint-disable-next-line import/no-extraneous-dependencies
import puppeteer from 'puppeteer-core';


import * as middlewares from './middlewares';
import MessageResponse from './interfaces/MessageResponse';

require('dotenv').config();

const app = express();
app.use(cors());


export async function scrape(url: string) {
  let browser;
  // const auth = process.env.SUPERPROXY_AUTH;
  try {
    // browser = await puppeteer.connect({
    //   browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`,
    // });
    browser = await puppeteer.launch({
      headless: 'new',
      channel: 'chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.goto(url);
    await page.waitForSelector('body');

    // Extract the plain HTML content of the specific section
    const sectionContent = await page.evaluate(() => {
      const section = document.querySelector('body');	
      if (section && 'innerText' in section) {
        return section.innerText;
      } else {
        throw new Error('Section content not found on the page.');
      }
    });

    if (sectionContent) {
      // Remove the \n characters and unnecessary spaces
      const cleanedContent = sectionContent
        .replace(/\n/g, '')
        .replace(/\s+/g, ' ') 
        .trim();
      return cleanedContent;

    } else {
      console.log('Section content not found on the page.');
    }

  } catch (e) {
    console.error('Scraping failed', e);
  } finally {
    await browser?.close();
  }
}


app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
  });
});

app.get<{}, MessageResponse>('/scrape', async (req, res) => {
  const { url } = req.query;
  if (url) {
    const response = await scrape(url as string);
    if (response) {
      res.json({ message: response });
    }
  } else {
    res.json({ message: 'Please provide a url' });
  }
});


app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
