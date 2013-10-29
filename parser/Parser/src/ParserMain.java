import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;


public class ParserMain {

	final static String apiFileExt = ".api";
	
	/**
	 * @param args
	 */
	public static void main(String[] args) {
		if(args.length<1)
		{
			System.out.println("You must provide a path to parse");
			return;
		}else if(args.length>1)
		{
			System.out.println("Too many arguments provided");
			return;
		}
		System.out.println("Parsing: "+args[0]);
		
		System.out.println(parseDirectory(new File(args[0])));
	}
	
	private static JsonElement parseDirectory(File dir)
	{
		JsonObject obj = new JsonObject();
		JsonArray children = new JsonArray();
	    for (final File fileEntry : dir.listFiles()) {
	    	String name = fileEntry.getName();
	        if (fileEntry.isDirectory()) {
	        	children.add(parseDirectory(fileEntry));
	        } else if(name.contains(".")
	        		&& name.substring(name.lastIndexOf("."))==apiFileExt){
	        	obj = parseFile(fileEntry);
	        }
	        else
	        {
	           children.add(parseFile(fileEntry));
	        }
	    }
    	obj.add("children", children);
    	if(obj.entrySet().size()==1)
    	{
    		//Set to an empty JSON object of some kind where no api file exists
    		System.out.println("No API file");
    	}
		return obj;
	}


	
	private static JsonObject parseFile(File file)
	{
		JsonObject obj = new JsonObject();

		try{
		    BufferedReader br = new BufferedReader(new FileReader("file.txt"));
		    try {
		    	String line;
		        while ((line=br.readLine()) != null) {
		        	//Parse line
		        }
		    } finally {
		        br.close();
		    }
		}
		catch(Exception ex)
		{
			System.out.println("File corrupted, this print should never happen");
		}
		return obj;
	}
	

}
