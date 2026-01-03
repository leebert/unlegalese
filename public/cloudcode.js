// Just a place to store all the cloud code written directly on the Back4App site until local dev is set up.
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
  
  const response = await openai.responses.create({
    model: 'gpt-5-nano-2025-08-07',
    instructions: 'You are a storyteller that talks like a pirate.',
    input: 'Tell a ten word story about a tardigrade.',
    stream: true,
  });

  var tokenCount = 0;
  for await (const event of response) {
    if(event.type == 'response.output_text.delta') {
      openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
      tokenCount++;
      openAIResponse.set('tokenCount', tokenCount);
      openAIResponse.save();
    }
  }
});

  // const stream = openai.responses
  //   .stream({
  //     model: 'gpt-5-nano-2025-08-07',
  //     instructions: 'You are a five year old storyteller.',
  //     input: 'Write a five word sentence about a tardigrade.',
  //   })
  //   .on("response.output_text.delta", (event) => {
  //       openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
  //       openAIResponse.save();
  //   })
  //   .on("response.error", (event) => {
  //     console.error(event.error);
  //   });

  // const result = await stream.finalResponse();
  // return result;

Parse.Cloud.define("getSummary", async (request) => {
  const OpenAIResponse = Parse.Object.extend("OpenAIResponse");
  const openAIResponse = new OpenAIResponse();
  openAIResponse.set('response', '');
  await openAIResponse.save();
  
  const legalese = request.params.legalese;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const response = await openai.responses.create({
    model: 'gpt-5-nano-2025-08-07',
    instructions: 'You are an expert in legal matters with a friendly, but concise, writing style.',
    input: `Write a layman-friendly summary of the following legal copy with no follow-up to do anything else. The summary should be no longer than four sentences. [BEGIN LEGAL COPY] ${legalese} [END LEGAL COPY]`,
    stream: true,
  });

  var tokenCount = 0;
  for await (const event of response) {
    if(event.type == 'response.output_text.delta') {
      openAIResponse.set('response', `${openAIResponse.get('response')}${event.delta}`);
      tokenCount++;
      openAIResponse.set('tokenCount', tokenCount);
      openAIResponse.save();
    }
  }
});