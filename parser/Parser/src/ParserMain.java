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
import com.google.gson.JsonPrimitive;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.regex.*;

public class ParserMain {

	final static String apiFileExt = ".api";
	static File logger;
	static File inputDirectory; 
	static PrintWriter P;
	static JsonArray objects = new JsonArray();
	static String rootDirectory;
	
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
		String timeStamp = new SimpleDateFormat("yyyy-MM-dd_HH:mm").format(Calendar.getInstance().getTime());

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
		rootDirectory = inputDirectory.getAbsolutePath();
		logger = new File(inputDirectory.getAbsolutePath()+"/ParseLog.txt");
		try {
			P = new PrintWriter(logger);
		} catch (FileNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		parseDirectory(new File(args[0]),"");
		PrintWriter outP;
		try {
			outP = new PrintWriter(new File(inputDirectory.getAbsolutePath()+"/ParseOutput.txt"));
			outP.write(objects.toString());
			outP.flush();
			outP.close();
		} catch (FileNotFoundException e) {
			System.out.println("Failed to write to output file");
			e.printStackTrace();
		}
		log("Parsing of " + inputDirectory.getPath() + " completed");
	}

	private static JsonElement parseDirectory(File dir, String path)
	{
		JsonObject obj = new JsonObject();
		JsonArray children = new JsonArray();
		String dirname = "";
		for (final File fileEntry : dir.listFiles()) {
			String name = fileEntry.getName();
			if(name.contains(".")
					&& name.substring(name.lastIndexOf(".")).equals(apiFileExt)){
				obj = parseDirApi(fileEntry,path);
			}
		}
		if(obj.has("name"))
			dirname = obj.get("name").getAsString();
		for (final File fileEntry : dir.listFiles()) {
			String name = fileEntry.getName();
			if(name.contains(".")
					&& name.substring(name.lastIndexOf(".")).equals(apiFileExt)){
				continue;
			}
			if (fileEntry.isDirectory()) {
				children.add(parseDirectory(fileEntry,path+"/"+dirname));
			}
			else
			{
				JsonElement s = parseFile(fileEntry,path+"/"+dirname);
				if(s!=null)
					children.add(s);
			}
		}
		
		obj.add("children", children);
		if(obj.entrySet().size()==1)
		{
			//Set to an empty JSON object of some kind where no api file exists
			log("No API file for Directory:" + dir.getPath());
		}
		objects.add(obj);
		return obj.get("name");
	}


	private static JsonElement parseFile(File file, String path)
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
								log("Unmatched comment block end at "+counter+" in "+file.getPath());
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
								log("Unmatched comment block end at "+counter+" in "+file.getPath());
								continue;
							}
							else
							{
								inComment = false;
								if(!(obj.has("attr") && obj.has("name") && obj.has("type") && obj.has("description") ))
								{
									log("Comment block at line "+counter+" in "+file.getPath() +" is missing an essential property");
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
								if(key.equals("children") || key.equals("path"))
									log("Use of a reserved keyword is being skipped at line " + counter + " in file " + file.getPath());
								else
									obj.addProperty(key, value);
								keyvalm=keyval.matcher(excess);
							}
						}
					}
					catch(Exception ex)
					{
						log("Parsing error at line "+counter+" in "+file.getPath()+". Continuing to next comment block.");
					}
				}

			}
			catch(Exception ex)
			{
				log("Failed to parse file:"+file.getPath());
			} finally {
				br.close();
			}
		}
		catch(Exception ex)
		{
			log("File structure corrupted at "+file.getPath() );
		}
		if(obj.has("name"))
		{
			if(!obj.has("children"))
				obj.add("children", new JsonArray());
			objects.add(obj);
			return new JsonPrimitive(path+obj.get("name").getAsString());
		}
		return null;
	}


	private static JsonObject parseDirApi(File file, String path)
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
								log("Unmatched comment block end at "+counter+" in "+file.getPath());
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
								log("Unmatched comment block end at "+counter+" in "+file.getPath());
								continue;
							}
							else
							{
								inComment = false;
								if(!(obj.has("attr") && obj.has("name") && obj.has("type") && obj.has("description") ))
								{
									log("Comment block at line "+counter+" in "+file.getPath() +" is missing an essential property");
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
								if(key.equals("children") || key.equals("path"))
									log("Use of a reserved keyword is being skipped at line " + counter + "in file " + file.getPath());
								else
									obj.addProperty(key, value);
								keyvalm=keyval.matcher(excess);
							}
						}
					}
					catch(Exception ex)
					{
						log("Parsing error at line "+counter+" in "+file.getPath()+". Continuing to next comment block.");
					}
				}

			}
			catch(Exception ex)
			{
				log("Failed to parse file:"+file.getPath());
			} finally {
				br.close();
			}
		}
		catch(Exception ex)
		{
			log("File structure corrupted at "+file.getPath() );
		}
		if(obj.has("name"))
		{
			obj.addProperty("path", path);
			if(!obj.has("children"))
				obj.add("children", new JsonArray());
			return obj;
		}
		return null;
	}


}
