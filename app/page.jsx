' use client'

import {
  useState 
} from 'react'

export default function Home(){
  const [query,setQuery]=useState('')
  const [results,setResults]= useState('')
  const [loading , setLoading] = useState(false)
  
// for setup we have the following function
  async function createIndexandEmbeddings() {
    try{
      const results =await fetch('api/setup',{
        method:"POST"
      })
    
    const json = await results.json()
    console.log("Result" , json)
    } catch(err){
      console.log("Error",err)
    }

  }

//for the read folder which contains the query function we have the following func

async function sendQuery(){
  if (!query) return
  setResults('')
  setLoading(true)
  try{
    const result = await fetch('api/read',{
      method:"POST",
      body : JSON.stringify(query)
    })
    const json = await result.json()
    console.log("Result", json)
    setResults(json.data)
    setLoading(false)
  } catch(err){
    console.log("Error", err)
    setLoading(false)
  }

}
  
  
  
  
  return (
      <main className= "flex flex-col items-centre justify-between p-24">
      <input 
      className= "text-black px-2 py-1"
      onChange={e=>setQuery(e.target.value)}
      />
      <button className='px-7 py-1 rounded-2xl bg-white text-black mt-2 mb-2' onClick={sendQuery}>
        ASK AI 
      </button>
      {
        loading && <p>Asking AI ...</p>
      }
      {
        result && <p>{result}</p>
      }
      <button onClick={createIndexandEmbeddings}>Create Index and Embeddings</button>
      </main>
    )
}