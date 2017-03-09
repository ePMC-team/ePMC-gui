package epmc.gui.jsapi;

import javafx.scene.web.WebView;

public class BrowserApi {
	
	private WebView browser;
	
	public BrowserApi(WebView _browser) {
		this.browser = _browser;
	}
	
	public void setZoom(double val) {
		this.browser.setZoom(val);
	}
	
	/**
	 * zoom function can be used to zoomIn or zoomOut
	 * a standard set of rates is pre-fixed
	 * 
	 * @param type enum { "in", "out" }
	 */
	public void zoom(String type) {
		double [] fixed = {0.1, 0.2, 0.5, 0.8, 1, 1.2, 1.5, 2};
	}

}
