package epmc.gui.jsapi;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import javafx.stage.FileChooser;
import javafx.stage.Stage;
import epmc.gui.jsapi.models.FileInfo;

public class FileApi {
	public Stage stage = null;
	
	public FileApi(Stage _stage) {
		this.stage = _stage;
	}
	
	public FileInfo load(String path) {
		FileInfo inf = new FileInfo();
		
		if (path.equals("")) {
			FileChooser fileChooser = new FileChooser();
			fileChooser.setTitle("Load ePMC model from");
			File selected = fileChooser.showOpenDialog(this.stage);
			if (selected == null) return null;
			
			inf.path = selected.getAbsolutePath();
		} else {
			inf.path = path;
		}
		
		try {
			File f = new File(inf.path);
			BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(f), "UTF-8"));
			long len = f.length();
			char buf[] = new char[(int) len];
			br.read(buf);
			inf.text = String.valueOf(buf);
			br.close();
		}
		catch (FileNotFoundException e) {
			inf.text = "exception caught: file not found.";
			inf.path = null;
		}
		catch (IOException e) {
			inf.text = "failed to read from the file due to unknown reason.";
			inf.path = null;
		}
		return inf;
	}
	
	/*
	 * if path == "", the model is brand new and not saved before
	 * otherwise just simply store the model to previous path
	 */
	public String save(String model, String path) {
		FileWriter writer;
		if (path.equals("")) {
			FileChooser fileChooser = new FileChooser();
			fileChooser.setTitle("Save ePMC model as");
			File selected = fileChooser.showSaveDialog(this.stage);
			try {
				writer = new FileWriter(selected);
				writer.write(model);
				writer.close();
				return selected.getAbsolutePath();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return null;
			}
		} else {
			try {
				writer = new FileWriter(new File(path));
				writer.write(model);
				writer.close();
				return path;
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return null;
			}
		}
	}
	
	public String load_fromjar(String path) {
		InputStream ins = getClass().getClassLoader().getResourceAsStream(path);
		StringBuilder sb = new StringBuilder();
		
		BufferedReader reader = new BufferedReader(new InputStreamReader(ins));
		String line = null;
		try {
			while ((line = reader.readLine()) != null) {
				sb.append(line);
				sb.append(System.getProperty("line.separator"));
			}
			ins.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return sb.toString();
	}
}
