package epmc.gui.interfaces;

import java.text.MessageFormat;
import java.util.HashMap;
import java.util.Locale;

import org.json.JSONObject;

import epmc.error.EPMCException;
import epmc.main.Analyse;
import epmc.main.RawModelLocalFiles;
import epmc.main.options.OptionsEPMC;
import epmc.main.options.UtilOptionsEPMC;
import epmc.messages.OptionsMessages;
import epmc.modelchecker.CommandTask;
import epmc.modelchecker.RawModel;
import epmc.modelchecker.RawProperty;
import epmc.options.Category;
import epmc.options.Option;
import epmc.options.Options;
import epmc.options.UtilOptions;
import epmc.plugin.OptionsPlugin;
import epmc.plugin.UtilPlugin;

import epmc.gui.jsapi.Logger;
import epmc.gui.interfaces.LogInterface;
import epmc.gui.jsapi.models.MCResult;


public final class RawEPMC {
    /** Empty string. */
    private final static String EMPTY = "";
    /** String ": ".*/
    private final static String SPACE_COLON = ": ";
    
    private final static Logger logger = new Logger();
    private static LogInterface log = null;
    
    /**
     * The {@code main} entry point of EPMC.
     * 
     * @param args parameters of EPMC.
     */
    public static MCResult main(String[] args) {
        assert args != null;
        for (String arg : args) {
            assert arg != null;
        }
        Options options = UtilOptionsEPMC.newOptions();
        MCResult result = new MCResult();
        log = new LogInterface(options, result);
        
        try {
            options = prepareOptions(args);
            result.result = StartAsGuiService(options);
        } catch (EPMCException e) {
        	// handle syntax errors / other errors
            String message = e.getProblem().getMessage(options.getLocale());
            MessageFormat formatter = new MessageFormat(EMPTY);
            formatter.applyPattern(message);
            String formattedMessage = formatter.format(e.getArguments(), new StringBuffer(), null).toString();
            logger.hosterr(formattedMessage);
            if (options == null || options.getBoolean(OptionsEPMC.PRINT_STACKTRACE)) {
                e.printStackTrace();
            }
            
            result.exception = e;
            result.message = new String(formattedMessage);
        } catch (RuntimeException e) {
        	logger.host("Runtime Exception: " + e.getMessage());
        	result.message = e.getMessage();
        	result.logs.add(e.getMessage());
        }
        
        return result;
    }
    
    public static String getOptions() {
    	Options options = UtilOptionsEPMC.newOptions();
    	try {
			options = prepareOptions(new String[0]);
			JSONObject obj = new JSONObject();
			for (Option option : options.getAllOptions().values()) {
				JSONObject curr = new JSONObject();
				
				if (option.getTypeInfo() == null) continue;
				String typeinfo = option.getTypeInfo().replaceAll("<", "").replaceAll(">", "");
				if (typeinfo.contains("|")) {
					// it is an enumerate
					curr.put("values", typeinfo.split("\\|"));
					typeinfo = "enum";
				}
				curr.put("type", typeinfo);

				if (option.getDefault() == null) continue;
				curr.put("default", option.getType().unparse(option.getDefault()).trim());
				if (curr.get("default").equals("")) continue;
				
				curr.put("comment", "");
				
				obj.put(option.getIdentifier(), curr);
				// System.out.println(option.getIdentifier() + ":" + curr.toString());
			}
			
			return obj.toString();

		} catch (EPMCException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
    }
    
    /**
     * Prepare options from command line arguments.
     * The command line arguments parameters must not be {@code null} and must
     * not contain {@code null} entries.
     * 
     * @param args command line arguments
     * @return options parsed from command line arguments
     * @throws EPMCException thrown in case of problems
     */
    private static Options prepareOptions(String[] args) throws EPMCException {
        assert args != null;
        for (String arg : args) {
            assert arg != null;
        }
        Locale locale = Locale.getDefault();
        Options options = UtilOptionsEPMC.newOptions();
        options.parseOptions(args, true);
        options.reset();
        UtilPlugin.loadPlugins(options);
        options.getOption(OptionsPlugin.PLUGIN).reset();
        options.getOption(OptionsPlugin.PLUGIN_LIST_FILE).reset();
        options.parseOptions(args, false);
        options.set(OptionsEPMC.LOCALE, locale);
        return options;
    }
    
    /**
     * Start the command to be executed with output shown in standard output.
     * The command to be executed will be read for {@link Options#COMMAND}.
     * Then, the client part of the command will be executed.
     * Afterwards, a task server will be created and the server part of the
     * command will be executed there.
     * The options parameter must not be {@code null}.
     * 
     * @param options options to use
     * @throws EPMCException thrown in case of problems
     */
    private static HashMap<String, String> StartAsGuiService(Options options) throws EPMCException {
        assert options != null;
        if (options.getString(Options.COMMAND) == null) {
            logger.host(options.getShortUsage());
            return null;
        }
        CommandTask command = UtilOptions.getInstance(options,
                OptionsEPMC.COMMAND_CLASS,
                Options.COMMAND);
        assert command != null;
        command.setOptions(options);
        options.set(OptionsMessages.LOG, log);
        command.executeOnClient();
        if (command.isRunOnServer()) {
            return execute(options, log);
        } else {
        	return null;
        }
    }

    /**
     * Execute task on a new task server and print results.
     * The options parameter must not be {@code null}.
     * 
     * @param options options to use
     * @param log2 
     * @throws EPMCException thrown in case of problems
     */
    private static HashMap<String, String> execute(Options options, LogInterface log) throws EPMCException {
        assert options != null;
        RawModel model = new RawModelLocalFiles(
                options.getStringList(OptionsEPMC.MODEL_INPUT_FILES).toArray(new String[0]),
                options.getStringList(OptionsEPMC.PROPERTY_INPUT_FILES).toArray(new String[0]));
        Analyse.execute(model, options, log);
        if (log.getException() != null) {
            throw log.getException();
        }
        
        return obtainResults(options, log);
    }

    /**
     * Print model checking result to command line.
     * The options and result parameters must not be {@code null}.
     * 
     * @param options options to use
     * @param log log used
     */
    private static HashMap<String, String> obtainResults(Options options, LogInterface log) {
        assert options != null;
        assert log != null;
        
        // String result = "";
        HashMap<String, String> hresult = new HashMap<String, String>();
        
        for (RawProperty prop : log.getProperties()) {
            String exprString = prop.getDefinition();
            Object propResult = log.get(prop);
            if (propResult == null) {
                continue;
            }
            String resultString = null;
            if (propResult instanceof EPMCException) {
                EPMCException e = (EPMCException) propResult;
                String message = e.getProblem().getMessage(options.getLocale());
                MessageFormat formatter = new MessageFormat(message);
                formatter.applyPattern(message);
                resultString = formatter.format(e.getArguments());
                if (options == null || options.getBoolean(OptionsEPMC.PRINT_STACKTRACE)) {
                    e.printStackTrace();
                }
            } else {
                resultString = propResult.toString();
            }
            // result += (exprString + SPACE_COLON + resultString) + "\n";
            hresult.put(exprString, resultString);
            logger.host(exprString + SPACE_COLON + resultString);
        }
        
        if (log.getCommonResult() != null) {
            logger.host(log.getCommonResult().toString());
        }
        
        return hresult;
    }
}
