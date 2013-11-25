
public class DocThing {
	
	/* @Doc
	 * 
	 * @name:stuff
	 * @type:function
	 * @description:This function takes x and y and does crazy stuff with them. 
	 * @return:int
	 * @arguments:int x, int y
	 * 
	 * @End
	 */
	public static int stuff(int x, int y){
		int z = 0;
		for (int i=0;i<y;i++)
			z=x+z*x;
		return z;
	}
	
	
	/* @Doc
	 * 
	 * @name:
	 * 		do
     * @type:function
	 * @description:This is
	 * 		a
	 * 		very bad description
	 * 		, right?
	 * @return:void
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub

	}
	
	/* @Doc
	 * 
	 * @name:act
	 * @description:Takes an Actor through its routine.
	 * @arguments:Actor a
	 * @type:function
	 * @return:int
	 * @End
	 */
	public static int act(Object a){
		
	}
	
	/* insert test with A: unclosed Doc and B: unmatched End */
	
	
}
