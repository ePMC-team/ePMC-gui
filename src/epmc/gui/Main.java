package epmc.gui;

import epmc.gui.jsapi.EpmcApi;
import epmc.gui.jsapi.Logger;
import epmc.gui.jsapi.FileApi;

import javafx.application.Application;
import javafx.beans.value.ChangeListener;
import javafx.beans.value.ObservableValue;
import javafx.concurrent.Worker.State;
import javafx.event.EventHandler;
import javafx.stage.Stage;
import javafx.stage.WindowEvent;
import javafx.scene.Scene;
import javafx.scene.layout.BorderPane;
import javafx.scene.web.WebView;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebErrorEvent;
import netscape.javascript.JSObject;

public class Main extends Application {
	@Override
	public void start(Stage primaryStage) {
		try {
			BorderPane root = new BorderPane();
			Scene scene = new Scene(root,1280,680);
			
			// create an instance of web browser
			final WebView browser = new WebView();
			final WebEngine engine = browser.getEngine();
			
			// load the window
			String docpath = "";
			try {
				docpath = getClass().getClassLoader().getResource("epmc/web/index.html").toExternalForm();
			}
			catch (Exception e) {
				System.out.println("file not found.");
			}
			engine.load(docpath);
			engine.setOnError(new EventHandler<WebErrorEvent>() {
				@Override
				public void handle(WebErrorEvent evt) {
					System.out.println(evt.getMessage());
				}
			});
			
			/*
			 * in some online examples, they tend to create the instance when setting js member.
			 * however, I found that this may lead to some life cycle-problem, these objects somehow
			 * can be destructed before the application is temrminated
			 */
			Logger logapi = new Logger();
			FileApi fileapi = new FileApi(primaryStage);
			EpmcApi epmcapi = new EpmcApi(primaryStage, engine);
			
			
			// register js api
			// it's IMPORTANT not to inject APIs before the page is loaded
			// otherwise, the `window` object may be refreshed
			engine.getLoadWorker().stateProperty().addListener(
					new ChangeListener<State>() {

						@Override
						public void changed(ObservableValue<? extends State> observable, State oldValue,
								State newValue) {
							logapi.host("Browser engine state updated: " + newValue.toString());
							switch (newValue) {
							case SUCCEEDED:
								// now let's register the APIs
								JSObject win = (JSObject) engine.executeScript("window");
								
								win.setMember("epmc", epmcapi);
								win.setMember("log", logapi);
								win.setMember("file", fileapi);
								
								engine.executeScript("init()");
							default:
								break;
							}
						}
						
					});
			
			
			// organize the layout
			scene.getStylesheets().add(getClass().getResource("application.css").toExternalForm());
			root.setCenter(browser);
			primaryStage.setScene(scene);
			primaryStage.setOnCloseRequest(new EventHandler<WindowEvent>() {
				@Override
				public void handle(WindowEvent event) {
					// invoke javascript
					JSObject util = (JSObject)engine.executeScript("window.util");
					util.call("exit");
					event.consume();
				}
			});

			primaryStage.setTitle("ePMC Local GUI");
			
			// start the application
			primaryStage.show();
			
		} catch(Exception e) {
			e.printStackTrace();
		}
	}
	
	public static void main(String[] args) {
		launch(args);
	}
}
