// we need the nextRequest and nextResponse for the route handling
// create an instance of the pinecone client
// get the query func from the utils
// get the index

import { NextRequest , NextResponse} from 'next/server' 
import {PineconeClient} from '@pinecone-database/pinecone'
import {
    queryPineconeVectorStoreandQueryLLM,
} from '../../../utils'

import { indexName } from '../../../config'


export async function POST(req:NextRequest){
    //new instance of the key
    const body=await req.json()
    const client = new PineconeClient()
    // create a client
    await client.init({
        apiKey: process.env.PINECONE_API_KEY || '',
        environment : process.env.PINECONE_ENVIRONMENT || ''
    })





    
}