package epmc.gui.jsapi.models;

import java.util.ArrayList;
import java.util.HashMap;

import org.json.*;

import epmc.error.EPMCException;

public class MCResult {
	public ArrayList<String> logs;
	public HashMap<String, String> result;
	public EPMCException exception;
	public String message;
	
	public MCResult() {
		this.logs = new ArrayList<String>();
		this.result = new HashMap<String, String>();
		this.exception = null;
		this.message = null;
	}
	
	public String toString() {
		return "Unimplemented Method toString()";
	}
	
	public String getMessage() {
		return this.message;
	}
	
	public long getLine() {
		return this.exception.getPositional().getLine();
	}
	
	public long getColumn() {
		return this.exception.getPositional().getColumn();
	}
	
	public String getLogs() {
		String result = "";
		for (String i : this.logs) {
			result += i + "\n";
		}
		
		if (this.exception != null) {
			result += String.format(
				"Exception (%s) found at line %d, column %d.",
				this.message,
				this.exception.getPositional().getLine(),
				this.exception.getPositional().getColumn()
			);
		}
		return result;
	}
	
	public String getResult() {
		String result = "";
		for (String prop : this.result.keySet()) {
			result += prop + " : " + this.result.get(prop) + "\n";
		}
		
		return result;
	}
}
