// loaders - to load data to start interacting with langchain api
import {NextResponse} from 'next/server'

import { PineconeClient } from '@pinecone-database/pinecone'
//loader for text
import {TextLoader} from 'langchain/document_loaders/fs/text'
//loader for pdf
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'
//loader for directories
import {DirectoryLoader} from 'langchain/document_loaders/fs/directory'
import {
    createPineconeIndex,
    updatePinecone
} from '../../../utils'
import { indexName } from  '../../../config'

//updatepinecone needs documents
// with this func we are getting those documents ready

export async function POST() {
    //using loader to get directory that contains docu

    const loader = new DirectoryLoader('./documents',{
        '.txt':(path) => new TextLoader(path),
        '.pdf':(path) => new PDFLoader(path),
        '.md':(path)=> new TextLoader(path)
    })

    const docs = await loader.load()
    const vectorDimensions = 1530

    const client = new PineconeClient()
    await client.init({
        apiKey: process.env.PINECONE_API_KEY || '',
        environment: process.env.PINECONE_ENVIRONEMNT || '' ,
    })

    try{
        await createPineconeIndex(client,indexName,vectorDimensions)
        await updatePinecone(client,indexName , docs)

    } catch (err) {
        console.log('Error: ', err)
    }

    return NextResponse.json({
        data :"Successfully created PineCone index and loaded data into pinecone"
    })

}


