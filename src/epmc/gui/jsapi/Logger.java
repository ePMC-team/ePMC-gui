package epmc.gui.jsapi;

import java.util.Date;
import java.io.PrintStream;
import java.text.SimpleDateFormat;

public class Logger {
	public void debug(String content) {
		this.write("debug", content);
	}
	
	public void info(String content) {
		this.write("info", content);
	}
	
	public void warn(String content) {
		this.write("warn", content);
	}
	
	public void err(String content) {
		this.write("error", content);
	}
	
	public void host(String content) {
		this.write("HOST", content);
	}
	
	public void hosterr(String content) {
		this.write("HERROR", content);
	}
	
	public void epmc(String content) {
		this.write("EPMC", content);
	}
	
	public void write(String level, String cont) {
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
		PrintStream target = System.out;
		if (level == "error" || level == "HERROR") target = System.err;
		
		target.printf("%s [%6s] %s\n", dateFormat.format(new Date()), level, cont);
	}
}
