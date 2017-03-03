package epmc.gui.jsapi;

import java.util.Date;
import java.text.SimpleDateFormat;
import java.io.File;
import java.io.IOException;

import javafx.stage.Stage;
import javafx.scene.web.WebEngine;
import netscape.javascript.JSObject;

import epmc.gui.interfaces.RawEPMC;
import epmc.gui.jsapi.models.FileInfo;
import epmc.gui.jsapi.models.MCResult;


public class EpmcApi {
	
	public Stage stage = null;
	public Logger logger = new Logger();
	public WebEngine engine = null;
	
	
	public String CONF_FOLDER = "./.epmcconf";
	public String HISTORY_FOLDER = CONF_FOLDER + "/history";
	public String HISTORY_LIST = HISTORY_FOLDER + "/list";
	public String MC_PREFIX = "/mc.history.";
	public String CONFIG = CONF_FOLDER + "/epmc_runtime";
	
	public String getConfFolder() { return CONF_FOLDER; }
	public String getHistoryFolder() { return HISTORY_FOLDER; }
	public String getHistoryList() { return HISTORY_LIST; }
	public String getMcPrefix() { return MC_PREFIX; }
	public String getConfig() { return CONFIG; }
	
	public EpmcApi(Stage _stage, WebEngine _engine) {
		this.stage = _stage;
		this.engine = _engine;
	}
	
	public void EpmcInit() {
		File history = new File(HISTORY_FOLDER);
		if (!history.exists()) {
			history.mkdirs();
		}
	}
	
	public MCResult ModelCheck(String rawmodel, String rawproperties, String rawoptions) {
		// is there a history folder?
		FileApi fileapi = new FileApi(stage);
		
		// put files into history folder
		File list = new File(HISTORY_LIST);
		if (!list.exists())
			try {
				list.createNewFile();
				logger.host("History list file created.");
			} catch (IOException e) {
				logger.host("Failed to create history list file.");
			}
		
		FileInfo list_file = fileapi.load(HISTORY_LIST);
		String [] history_items = list_file.text.split("\n");
		
		int suffix = history_items.length; 
		
		String newpath = HISTORY_FOLDER + MC_PREFIX + suffix;
		if (fileapi.save(rawmodel, newpath + ".model") == null) {
			// TODO
		}
		if (fileapi.save(rawproperties, newpath + ".prop") == null) {
			// TODO
		}
		if (fileapi.save(rawoptions, newpath + ".option") == null) {
			// TODO
		}
		
		rawoptions = "check --model-input-files " + (newpath + ".model") +
				" --property-input-files " + (newpath + ".prop") + " " +
				rawoptions;
		
		logger.host(rawoptions);
		MCResult result = RawEPMC.main(rawoptions.split(" "));
		
		// set date-time format
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		
		list_file.text += df.format(new Date()) + " " + suffix + "\n";
		fileapi.save(list_file.text, list_file.path);
		
		if (fileapi.save(result.getResult(), newpath + ".result") == null) {
			logger.host("Error: Cannot save computation results.");
		}
		
		if (fileapi.save(result.getLogs(), newpath + ".log") == null) {
			logger.host("Error: Cannot save computation logs.");
		}
		
		logger.host("Model Checking Finished!");
		
		if (result.exception == null) return null;
		else return result;
	}
	
	public String GetOptions() {
		return RawEPMC.getOptions();
	}
	
	public JSObject eval(String code) {
		return (JSObject) engine.executeScript(code);
	}
	
	public void exit() {
		logger.host("EpmcApi exit invoked.");
		this.stage.close();
	}
}
