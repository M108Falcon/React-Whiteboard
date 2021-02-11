import React,{useState,useEffect} from 'react';
import { Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import './App.css';

function Message(){
        const [ImageFile, setImageFile] = useState()
        const [preview, setPreview] = useState()
        useEffect(() => {
            if (!ImageFile) {
                setPreview(undefined)
                return
            }
      
            const objectUrl = URL.createObjectURL(ImageFile)
            setPreview(objectUrl)
      
          
            return () => URL.revokeObjectURL(objectUrl)
        }, [ImageFile])
      
        const imagehandler = event => {
            if (!event.target.files || event.target.files.length === 0) {
                setImageFile(undefined)
                return
            }
      
           
            setImageFile(event.target.files[0])
        }
      
    var[message, setmessage]=useState('');
    var messagehandler= event=>
    {
        setmessage(event.target.value);
    }
    return(
        <div>
            <label className="add"><AddIcon variant="filled" color="primary" fontSize="large"></AddIcon></label>
            <label className="clear"><ClearIcon variant="filled" color="primary" fontSize="large"></ClearIcon></label>
        <div className="myform">
            <label className="myform1" htmlFor="message">Enter the message</label>
           <textarea id="message" type="text" placeholder="Enter the messages" onChange={messagehandler}/>
           <h3>{message}</h3>
        </div>
        <div className="browse">
          <label className="myimg" htmlFor="message">Select the Image</label>
          <form>
           <input type="file" id="myfile" name="myfile" multiple onChange={imagehandler}/><br></br><br></br>
           </form>
           {ImageFile &&  <img class="preview" src={preview} /> }
        </div>
        </div>
       
    );
}
export default Message