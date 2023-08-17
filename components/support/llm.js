import * as webllm from "@mlc-ai/web-llm"
//import {ref} from 'vue'   //TODO:add reactivity to init_label and generate_label


export class LLM {

    static run = true
    static init_label = ''
    static generate_label = ''
    static chat = ''

    //config ref: https://github.com/mlc-ai/web-llm/blob/main/examples/simple-chat/src/gh-config.js
    static async configure(){
        const myLlamaUrl = "https://huggingface.co/mlc-ai/mlc-chat-Llama-2-7b-chat-hf-q4f32_1/resolve/main/";
        const appConfig = {
            "model_list": [
              {
                "model_url": myLlamaUrl,
                "local_id": "Llama-2-7b-chat-hf-q4f32_1"
              }
            ],
            "model_lib_map": {
              "Llama-2-7b-chat-hf-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f32_1-webgpu.wasm",
            }
        }
        // override default
        const chatOpts = {
          "repetition_penalty": 1.01
        }

        //const chat = new ChatModule()
        this.chat = new webllm.ChatWorkerClient(new Worker(
            new URL('./llm_worker.js', import.meta.url),
            {type: 'module'}
          ))
        this.chat.setInitProgressCallback((report) => {      //report: webllm.InitProgressReport
            this.init_label = report.text
            console.log(this.init_label)
        })

        await this.chat.reload("Llama-2-7b-chat-hf-q4f32_1", chatOpts, appConfig)     //"vicuna-v1-7b-q4f32_0") 
        return true
    }
        
    static generateProgressCallback = (_step, message) => {     //_step: number, message: string
        this.generate_label = message
    }

    static async createDialogue(prompt0){
        console.log('create dialogue...')
        //const prompt0 = "why is liquidity important in banking."
        const reply0 = await this.chat.generate(prompt0, this.generateProgressCallback)
        console.log(reply0)
        return reply0
    }
}