import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.util.regex.*;

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
					&& name.substring(name.lastIndexOf(".")).equals(apiFileExt)){
				obj = parseFile(fileEntry);
			}
			else
			{
				System.out.println("childadd");
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
		System.out.println(file.getName());
		try{
			BufferedReader br = new BufferedReader(new FileReader(file));
			try {
				boolean inComment = false;
				boolean inkeyval = false;
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
								System.out.println("Unmatched comment block end");
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
								System.out.println("Unmatched comment block end");
								continue;
							}
							else
								inComment = false;
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
						System.out.println("Parsing error at line "+counter+". Continuing to next comment block.");
					}
				}

			}
			catch(Exception ex)
			{
				System.out.println("Parsing error");
				ex.printStackTrace();

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
