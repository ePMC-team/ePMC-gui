package epmc.gui.interfaces;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

import epmc.error.EPMCException;
import epmc.gui.jsapi.Logger;
import epmc.gui.jsapi.models.MCResult;
import epmc.messages.Message;
import epmc.messages.OptionsMessages;
import epmc.messages.UtilMessages;
import epmc.modelchecker.Log;
import epmc.modelchecker.ModelCheckerResult;
import epmc.modelchecker.RawProperty;
import epmc.options.Options;


public final class LogInterface implements Log {
	private final static Logger logger = new Logger();
	
    /** Empty string. */
    private final static String EMPTY = "";
    /** String containing a single space. */
    private final static String SPACE = " ";
    /** Formatter used for printing. */
    private final static MessageFormat formatter = new MessageFormat(EMPTY);
    /** Options used. */
    private final Options options;
    
    /** Logs which will be shown to users **/
    public final ArrayList<String> loglist;

    /** Whether the log should not print messages for the moment. */
    private boolean silent;
    /** Exception thrown. */
    private EPMCException exception;    
    /**
     * Whether message should be output in human-readable format.
     * If yes, full sentences will be generated.
     * If not, the message type identifier followed by its parameters will be
     * printed.
     */
    private boolean translate;
    /** Time at which the log has been created, ms since epoche time. */
    private long timeStarted;
    /** Result common to all properties. */
    private Object commonResult;
    /** Map from properties to results computed for them. */
    private final Map<RawProperty, Object> results = new LinkedHashMap<>();

    /**
     * Create new command line log.
     * The options parameter must not be {@code null}.
     * 
     * @param options options to use
     * @param result 
     */
    public LogInterface(Options options, MCResult result) {
        assert options != null;
        this.options = options;
        this.loglist = result.logs;
        translate = options.getBoolean(OptionsMessages.TRANSLATE_MESSAGES);
        timeStarted = System.currentTimeMillis();
    }
    
    @Override
    public void send(Message message, Object... parameters) {
        if (silent) {
            return;
        }
        for (Object param : parameters) {
            assert param != null;
        }

        if (translate) {
            Locale locale = this.options.getLocale();
            formatter.applyPattern(message.getMessage(locale));
            String msg = formatter.format(parameters);
            logger.epmc(msg);
            loglist.add(msg);
        } else {
        	String prt = "";
            prt += message.toString();
            for (Object argument : parameters) {
                prt += SPACE + argument;
            }
            logger.epmc(prt);
            loglist.add(prt);
        }
    }

    @Override
    public void send(EPMCException exception) {
        assert exception != null;
        this.exception = exception;
        logger.err(exception.toString());
        loglist.add(exception.toString());
    }

    @Override
    public void send(ModelCheckerResult result) {
        assert result != null;
        if (result.getProperty() == null) {
            commonResult = result.getResult();
        } else {
            results.put(result.getProperty(), result.getResult());
        }
    }

    @Override
    public void setSilent(boolean silent) {
        this.silent = silent;
    }

    @Override
    public boolean isSilent() {
        return silent;
    }
    
    /**
     * Get exception thrown.
     * 
     * @return exception thrown
     */
    public EPMCException getException() {
        return exception;
    }
    
    /**
     * Get common result obtained.
     * 
     * @return common result obtained
     */
    public Object getCommonResult() {
        return commonResult;
    }
    
    /**
     * Get properties for which results were computed.
     * 
     * @return properties for which results were computed
     */
    public Collection<RawProperty> getProperties() {
        return results.keySet();
    }

    /**
     * Get result for a given property.
     * The property parameter must not be {@code null}.
     * 
     * @param property property for which to get result
     * @return result for a given property
     */
    public Object get(RawProperty property) {
        assert property != null;
        return results.get(property);
    }
}
