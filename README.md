# Prompt playground with automatic optimizer

https://github.com/user-attachments/assets/b869ba6b-1c85-4d64-99d1-01fe6e3751fd


## How to run

* Install dependencies:

```bash
npm install
```

* Create a `.env` file:

```bash
LITELLM_API_KEY=...
LITELLM_ENDPOINT=...
```

* Run:

```bash
npm run dev
```

* Open the displayed address in the browser.


## Usage

* Double click to create a new data node. Use it to store context you would precompute in your pipeline.
* Extend a new connection to create a new prompt node. Modify the prompt inside. A new version will be created every time you stop typing and the outputs will be computed immediately.
