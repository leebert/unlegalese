// A place to store all the cloud code written directly on the Back4App site until local dev is set up.

//app.js
const OpenAI = require("openai");
const express = require('express');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());
app.post("/unlegalese-stream", async (req, res) => {
  const { message } = req.body;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const stream = await client.responses.stream({
      model: "gpt-5-nano-2025-08-07",
      input: [
        {
          role: "system",
          content: "You are an expert in legal matters with a friendly, but concise, writing style. Write a layman-friendly, plain English summary of the legal copy provided by the user. The summary should be between five and eight sentences long.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      stream: true,
    });

    for await (const event of stream) {
      // Text tokens
      if (event.type === "response.output_text.delta") {
        res.write(`data: ${JSON.stringify(event.delta)}\n\n`);
      }

      // Optional: detect completion
      if (event.type === "response.completed") {
        res.write(`event: done\ndata: [DONE]\n\n`);
        res.end();
      }
    }
  } catch (err) {
    console.error(err);
    res.write(
      `event: error\ndata: ${JSON.stringify(err.message)}\n\n`
    );
    res.end();
  }
});

app.post("/unlegalese-structured", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert in legal matters. Analyze legal documents and provide structured summaries using human-friendly, plain English words."
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "legal_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "A brief title for the legal document"
              },
              plain_language_version: {
                type: "string",
                description: "Ultra-simplified version for quick reading"
              },
              key_points: {
                type: "array",
                description: "Key points extracted from the legal text",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["heading", "explanation"],
                  additionalProperties: false
                }
              },
              concerns: {
                type: "array",
                description: "Potential concerns or red flags",
                items: { type: "string" }
              }
            },
            required: ["title", "plain_language_version", "key_points", "concerns"],
            additionalProperties: false
          }
        }
      }
    });

    const structuredData = JSON.parse(response.choices[0].message.content);
    
    res.json({
      success: true,
      data: structuredData,
      usage: response.usage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.post("/unlegalese-structured-stream", async (req, res) => {
  const { message } = req.body;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert in legal matters. Analyze legal documents and provide structured summaries using human-friendly, plain English words."
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "legal_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "A brief title for the legal document"
              },
              plain_language_version: {
                type: "string",
                description: "Ultra-simplified version for quick reading"
              },
              key_points: {
                type: "array",
                description: "Key points extracted from the legal text",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    explanation: { type: "string" }
                  },
                  required: ["heading", "explanation"],
                  additionalProperties: false
                }
              },
              concerns: {
                type: "array",
                description: "Potential concerns or red flags",
                items: { type: "string" }
              }
            },
            required: ["title", "plain_language_version", "key_points", "concerns"],
            additionalProperties: false
          }
        }
      },
      stream: true
    });

    let accumulatedContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      
      if (delta) {
        accumulatedContent += delta;
        
        // Send the raw delta for progress indication
        res.write(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`);
      }

      // Check if streaming is complete
      if (chunk.choices[0]?.finish_reason === "stop") {
        // Parse the complete JSON and send as structured data
        try {
          const structuredData = JSON.parse(accumulatedContent);
          res.write(`data: ${JSON.stringify({ type: "complete", data: structuredData })}\n\n`);
        } catch (parseError) {
          res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to parse structured data" })}\n\n`);
        }
        
        res.write(`event: done\ndata: [DONE]\n\n`);
        res.end();
      }
    }

  } catch (err) {
    console.error(err);
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`
    );
    res.end();
  }
});

//main.js
//NOTE: None of this code works for streaming. 
//SSE updates are blocked until the functions complete.
//But I'm keepin it here for posterity's sake.

const OpenAI = require("openai");

Parse.Cloud.define("testOpenAI", async (request) => {
  const OpenAIResponse = Parse.Object.extend("OpenAIResponse");
  const openAIResponse = new OpenAIResponse();
  openAIResponse.set('response', '');
  openAIResponse.set('tokenCount', 0);
  await openAIResponse.save();
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // const response = await openai.responses.create({
  //   model: 'gpt-5-nano-2025-08-07',
  //   instructions: 'You are a storyteller that talks like a pirate.',
  //   input: 'Tell a ten word story about a tardigrade.',
  //   stream: true,
  // });

  // var tokenCount = 0;
  // for await (const event of response) {
  //   if(event.type == 'response.output_text.delta') {
  //     openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
  //     tokenCount++;
  //     openAIResponse.set('tokenCount', tokenCount);
  //     openAIResponse.save();
  //   }
  // }

  console.log('Starting stream for testOpenAI.');
  var tokenCount = 0;
  const stream = openai.responses
    .stream({
    model: 'gpt-5-nano-2025-08-07',
    instructions: 'You are a storyteller that talks like a pirate.',
    input: 'Tell a ten word story about a tardigrade.',
    stream: true,
    })
    .on("response.output_text.delta", (event) => {
      const now = new Date();
      console.log(`⏲ Timestamp - ${now.toLocaleTimeString()}`);
      openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
      tokenCount++;
      openAIResponse.set('tokenCount', tokenCount);
      openAIResponse.save();
    })
    .on("response.error", (event) => {
      console.error(event.error);
    });
  
});

Parse.Cloud.define("getSummary", async (request) => {
  const OpenAIResponse = Parse.Object.extend("OpenAIResponse");
  const openAIResponse = new OpenAIResponse();
  openAIResponse.set('response', '');
  await openAIResponse.save();
  
  const legalese = request.params.legalese;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // const response = await openai.responses.create({
  //   model: 'gpt-5-nano-2025-08-07',
  //   instructions: 'You are an expert in legal matters with a friendly, but concise, writing style.',
  //   input: `Write a layman-friendly summary of the following legal copy with no follow-up to do anything else. The summary should be no longer than four sentences. [BEGIN LEGAL COPY] ${legalese} [END LEGAL COPY]`,
  //   stream: true,
  // });

  // var tokenCount = 0;
  // for await (const event of response) {
  //   if(event.type == 'response.output_text.delta') {
  //     openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
  //     tokenCount++;
  //     openAIResponse.set('tokenCount', tokenCount);
  //     openAIResponse.save();
  //   }
  // }

  var tokenCount = 0;
  const stream = openai.responses
    .stream({
      model: 'gpt-5-nano-2025-08-07',
      instructions: 'You are an expert in legal matters with a friendly, but concise, writing style.',
      input: `Write a layman-friendly summary of the following legal copy with no follow-up to do anything else. The summary should be no longer than four sentences. After each sentence create a new line by adding \n [BEGIN LEGAL COPY] ${legalese} [END LEGAL COPY]`,
      stream: true,
    })
    .on("response.output_text.delta", (event) => {
      openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
      tokenCount++;
      openAIResponse.set('tokenCount', tokenCount);
      openAIResponse.save();
    })
    .on("response.error", (event) => {
      console.error(event.error);
    });

  // const result = await stream.finalResponse();
  // return result;
  
});