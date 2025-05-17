"use server";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: process.env.LITELLM_ENDPOINT,
});

export async function processPrompt(prompt: string): Promise<string> {
  // const response = await client.completions.create({
  //   model: "azure/gpt-4.1",
  //   prompt: prompt,
  // });

  // return response.choices[0].text;

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";
}
