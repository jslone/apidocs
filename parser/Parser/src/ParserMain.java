import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.regex.*;

public class ParserMain {

	final static String apiFileExt = ".api";
	static File logger;
	static File inputDirectory; 
	static PrintWriter P;
	
	/**
	 * @param args
	 */
	public static void log(String arg)
	{
		if(logger==null)
			return;
		if(!logger.exists())
		{
			try {
				logger.createNewFile();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(Calendar.getInstance().getTime());

		P.write("["+timeStamp+"]\t"+ arg+"\n");
		P.flush();
	}
	
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
		
		inputDirectory = new File(args[0]);
		
		if(!inputDirectory.exists())
		{
			System.out.println("Specified input directory does not exist.");
			return;
		
		}
		logger = new File(inputDirectory.getAbsolutePath()+"/ParseLog.txt");
		try {
			P = new PrintWriter(logger);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		JsonElement result = parseDirectory(new File(args[0]));
		System.out.println(result);
		log("Parsing of " + inputDirectory.getPath() + " completed");
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
					&& name.substring(name.lastIndexOf(".")).equals(apiFileExt)){
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
			log("No API file for Directory:" + dir.getPath());
		}
		return obj;
	}



	private static JsonObject parseFile(File file)
	{
		JsonObject obj = new JsonObject();
		try{
			BufferedReader br = new BufferedReader(new FileReader(file));
			try {
				boolean inComment = false;
				String line;
				String excess;
				int counter=0;
				while ((line=br.readLine()) != null) {
					counter++;
					try{
						if (line.contains("@Doc"))
						{
							if(inComment)
							{
								log("Unmatched comment block end at "+counter+" in "+file.getName());
								continue;
							}
							else
							{
								inComment = true;
							}
						}
						if(line.contains("@End"))
						{
							if(!inComment)
							{
								log("Unmatched comment block end at "+counter+" in "+file.getName());
								continue;
							}
							else
							{
								inComment = false;
								if(!(obj.has("attr") && obj.has("name") && obj.has("type") && obj.has("description") ))
								{
									log("Comment block at line "+counter+" in "+file.getName() +" is missing an essential property");
								}	
							}
						}
						Pattern hyperlink = Pattern.compile("(.*)(@Link)(\\(.*\\))(.*)");
						Matcher hyperlinkm = hyperlink.matcher(line);
						if(inComment)
						{
							while(hyperlinkm.matches())
							{
								String l = hyperlinkm.group(3);
								line=hyperlinkm.group(1)+"<a href = "+
										l.substring(1,l.length()-1)+ ">"+
										l.substring(l.lastIndexOf("/")+1,l.length()-1)
										+ " </a>"
										+ hyperlinkm.group(4);

								hyperlinkm = hyperlink.matcher(line);
							}
							Pattern keyval = Pattern.compile(".*@(.*):(.*)");
							Matcher keyvalm = keyval.matcher(line);
							while(keyvalm.matches())
							{
								String key = keyvalm.group(1);
								excess = keyvalm.group(2);
								String value = excess;
								if(excess.contains("@"))
								{
									value = excess.substring(0,excess.indexOf("@"));
									excess = excess.substring(excess.indexOf("@"));
								}
								obj.addProperty(key, value);
								keyvalm=keyval.matcher(excess);
							}
						}
					}
					catch(Exception ex)
					{
						log("Parsing error at line "+counter+" in "+file.getName()+". Continuing to next comment block.");
					}
				}

			}
			catch(Exception ex)
			{
				log("Failed to parse file:"+file.getName());
			} finally {
				br.close();
			}
		}
		catch(Exception ex)
		{
			log("File structure corrupted at "+file.getName() );
		}
		return obj;
	}


}
