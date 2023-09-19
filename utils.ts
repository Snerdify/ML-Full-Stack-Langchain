//holds functionality for pinecone ,openai and 
//langchain

// function 3: query the pinecone databse
// 1. create the pinecone index
// 2. uploading data to the pinecone index


// step 1 : imports

import {OpenAIEmbeddings} from 'langchain/embeddings/openai'
//to chunk larger amounts of text
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'
import {OpenAI} from 'langchain/llms/openai'
// question -answer api
import {loadQAStuffChain} from 'langchain/chains'
import {Document} from 'langchain/document'
import {indexName, timeout} from './config'



// create a index
export const createPineconeIndex = async (
    client,
    indexName,
    vectorDimension
) => { 
    //check if the index is there
    console.log('Checking "${indexName}" ...');
    // check to see if the index already exists
    // so get a list of existing indexes
    const existingIndexes = await client.listIndexes();


    // if the index doesnt exist create one
    if (!existingIndexes.includes(indexName)) {
        //log index creation
        console.log('Creating "${indexName)" ...');
        //create index
        await client.createIndex({
            createRequest :{
                name:indexName,
                dimension:vectorDimension,
                metric:'cosine',
            },
        });
        //log the successful creation
        console.log('Creating a new index... please wait');

        // wait for index initilization
        await new Promise((resolve)=> setTimeout(resolve,timeout));
    } else {
        //if the index is already present the log that
        console.log('Index "${indexName}" already exists');
    }

}



// now that the index is created . Uplaod the data to the index
export const UpdatePinecone = async (client,indexName,docs)=>{

    // Retrieve The Pinecone index
    const index = client.Index(indexName);
    // log this index
    console.log('Pinecone index retrieved : "${indexName}" ...');

    // process each doc in the docs array
    // so loop over the docs
    for (const doc of docs){
        console.log('Processing document: $"(doc.metadata.source)".. ');
        // retrives some specific data about text path and text
        const txtPath= doc.metadata.source;
        const text = doc.pageContent;

        // create recursive text splitter instance
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,

        });
        // log that we are splitting the chunks
        console.log('Slitting text into chunks...');

        //now we actually divide the text into chunks of 100
        const chunks = await textSplitter.createDocuments((text));
        //log that we have splitted the chunks
        console.log('Text has been split into $(chunks.length) chunks');

        // now we call openai embedding api to convert the split text into chunks
        // carete the OpenAi embeddings for Documents
        const embeddingsArrays = await new OpenAIEmbeddings().embedDocuments(
            // here we are finding any instance of a new line and replace it with space
            chunks.map((chunk) => chunk.pageContent.replace(/\n/g," "))
        );

        // create a batch size of 100 and initilaize an array 
        const batchSize= 100;
        let batch:any =[];
        // loop to populate the array
        for (let idx=0; idx <chunks.length ; idx++){
            const chunk = chunks[idx];
            const vector ={
                id :'${txtPath}_${idx}' ,
                values: embeddingsArrays[idx],
                metadata: {
                    ...chunk.metadata,
                    loc: JSON.stringify(chunk.metadata.loc),
                    pageContent : chunk.pageContent,
                    textPath: txtPath ,},

        };
        // now we push the vector to the batch array

        batch = [...batch , vector]

        // now we check to see if the batch size is full , then upload it to pinecone
        if (batch.length===batchSize || idx===chunks.length-1){
            await index.upsert({
                upsertRequest:{
                    vectors: batch,
                },
            });
            // once uploaded to pinecone , empty the batch
            batch = []; 

        }

      }





    }
}



// finally we create a func to query the database
export const queryPineconeVectorStoreandQueryLLM = async(client,indexName,question)=>{
  
    //console,log the query start process
    console.log("Querying the Pinecone database");
    //Retrieve the Pinecone index
    const index = client.Index(indexName);
    // use openai embedding to create a embedding of the query
    // this is similar to what we did in the prev function with the documents
    const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question)
    
    // now query the Pinecone and return top 10 matchws
    let queryResponse = await index.query({
        queryRequest:{
            topK:10,
            vector:queryEmbedding,
            includeMetadata :true,
            includeValues:true,
        },
    });
    // log the nuber of matches we get if we get any
    console.log('Found $(queryResponse.matches.length) matches...');
    // log the question that is being asked
    console.log('Asking question: $(question)....');

    // now if the query gets a match then trigger our llm 
    if (queryResponse.matches.length){
        // create an openai instance and load the QAStuffchain
        // read more about chains in the langchain docu
        const llm = new OpenAI({});
        const chain = loadQAStuffChain(llm);
        // extract and concatenate pagecontent from matched docu
        const concatenatedPageContent = queryResponse.matches
            .map((match) => match.metadata.pageContent)
            .join(" ") ;

        //make a call using the data that we have

        const result = await chain.call({
            input_documents: [new Document({pageContent : concatenatedPageContent})],
            question : question , 
        });
        // display the data that we have
        console.log('Answer : $(result.text) ');
        return result.text

    } else{
        // if we have no matches , then we will display below msg
        console.log('No matches found, hence GPT-3 will not be queried');
        
    }

}


