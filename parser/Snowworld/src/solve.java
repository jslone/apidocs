import java.io.File;
import java.io.FileNotFoundException;
import java.util.*;
import java.util.Map.Entry;

class Edge implements Comparable<Edge> {
	int to;
	int from;
	Double snow;
	String label;

	public Edge(int to, int from, Double snow) {
		this.to = to;
		this.from = from;
		this.snow = snow;
		label="\n";
	}

	public Edge(int to, int from, Double snow, String label) {
		this.to = to;
		this.from = from;
		this.snow = snow;
		this.label = "\n"+label;
	}

	public void setLabel(String s) {
		label = "\n"+s+"\n";
	}

	public String getLabel() {
		return label;
	}

	public int getTo() {
		return to;
	}

	public int getFrom() {
		return from;
	}

	public double getSnow() {
		return snow;
	}

	@Override
	public int compareTo(Edge e) {
		return snow.compareTo(e.snow);
	}

	public String toString() {
		return "(" + from + "," + to + "," + snow + ")";
	}

}

class solve {
	static HashMap<Integer, ArrayList<Edge>> adjMap;
	static ArrayList<Edge> E;
	static double alpha;

	static ArrayList<Edge> getEdgeList(int e, Scanner reader) {
		// Scanner reader = new Scanner(System.in);
		ArrayList<Edge> edges = new ArrayList<Edge>();
		for (int i = 0; i < e; i++) {
			edges.add(new Edge(reader.nextInt(), reader.nextInt(), reader
					.nextDouble()));
		}
		return edges;

	}

	static int[][] adjacencyMatrix(int n, ArrayList<Edge> edges) {
		int adjMat[][] = new int[n][n];
		for (int i = 0; i < edges.size(); i++) {
			adjMat[edges.get(i).getTo()][edges.get(i).getFrom()] = 1;
			adjMat[edges.get(i).getFrom()][edges.get(i).getTo()] = 1;
		}
		return adjMat;
	}

	static HashMap<Integer, ArrayList<Edge>> adjacencyMap(int n,
			ArrayList<Edge> edges) {
		HashMap<Integer, ArrayList<Edge>> adjMap = new HashMap<Integer, ArrayList<Edge>>();
		for (int i = 0; i < n; i++) {
			adjMap.put(i, new ArrayList<Edge>());
		}
		for (Edge e : edges) {
			adjMap.get(e.from).add(e);
		}
		return adjMap;
	}

	static Edge maxEdge() {
		return E.get(E.size() - 1);
	}

	static Edge maxEdgeNotVisited(Integer src, HashSet<Integer> visited) {
		ArrayList<Edge> N = adjMap.get(src);
		for (int i = N.size() - 1; i >= 0; i--) {
			if (!visited.contains(N.get(i).to)) {
				return N.get(i);
			}
		}
		return null;
	}

	static Edge maxEdgeSnow(Integer src, HashSet<Integer> visited) {
		double max = 0;
		Edge maxE = null;
		for (Edge e : adjMap.get(src)) {
			if (visited.contains(e) || e.to == 0)
				continue;
			double tot = 0;
			for (Edge e2 : adjMap.get(e.to)) {
				if (visited.contains(e2.to))
					continue;
				tot += e2.snow;
			}
			if (tot > max) {
				maxE = e;
				max = tot;
			}
		}
		return maxE;
	}

	static void addReflections() {
		int o = E.size();
		for (int i = 0; i < o; i++) {
			Edge old = E.get(i);
			E.add(new Edge(old.from, old.to, old.snow));
		}
	}

	static void eliminateBridges()
	{
		Iterator<Entry<Integer, ArrayList<Edge>>> it= adjMap.entrySet().iterator();
		while(it.hasNext())
		{
			Entry ent = it.next();
			List<Edge> L = (ArrayList<Edge>)ent.getValue();
			if(L.size() == 2)
			{
				Edge e1 = L.get(0);
				Edge e2 = L.get(1);
				it.remove();
				adjMap.get(e1.to).add(new Edge(e2.to,e1.to,e1.snow+e2.snow,String.valueOf(e2.from)+e2.getLabel()));
			}
		}
	}

	@SuppressWarnings("unchecked")
	static void solve() {
		addReflections();
		eliminateBridges();
		HashSet<Integer> V = new HashSet<Integer>();
		ArrayList<Edge> path = new ArrayList<Edge>();

		Integer loc = 0;
		Edge e = maxEdgeSnow(0, V);
		while (e != null) {
			path.add(e);
			V.add(e.to);
			loc = e.to;
			e = maxEdgeSnow(loc, V);
			// e=maxEdgeNotVisited(loc, V);
		}
		// double tot = 0;
		for (Edge edge : path) {
			// tot+=edge.snow;
			System.out.print(edge.from+edge.label);
		}
		// System.out.println(tot);

	}

	public static void main(String[] args) throws FileNotFoundException {
		Scanner reader = new Scanner(new File("SampleGraphs/50Sample.txt"));
		int n;
		int e;
		n = reader.nextInt();
		e = reader.nextInt();
		alpha = reader.nextDouble();

		E = getEdgeList(e, reader);
		Collections.sort(E);
		adjMap = adjacencyMap(n, E);

		solve();

		return;
	}

}
