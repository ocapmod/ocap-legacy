/*

    ==========================================================================================

    Copyright (C) 2018 Jamie Goodson (aka MisterGoodson) (goodsonjamie@yahoo.co.uk)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    ==========================================================================================

 * Sends supplied JSON string to Capture Manager.
 * JSON string can (and should) be supplied in multiple separate calls to this extension
 * (as to avoid the Arma buffer limit).
 */

using RGiesecke.DllExport;
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Net.Http;
using System.Net;

namespace OCAPExporter
{
    public class Main
    {
        static string LOGDIR = "ocap_logs";
        static string LOGFILE = string.Format("{0}/log.txt", LOGDIR);
        static string LOGRAWFILE = string.Format("{0}/export_raw.txt", LOGDIR);
        static string LOGJSONFILE = string.Format("{0}/export.json", LOGDIR);
        static List<string> argKeys = new List<string> { "capManagerHost" };


        // To send a string back to Arma, append to the output StringBuilder. Arma outputSize limit applies!
        [DllExport("RVExtension", CallingConvention = System.Runtime.InteropServices.CallingConvention.Winapi)]
        public static void RVExtension(StringBuilder output, int outputSize, string input)
        {
            outputSize--;
            Directory.CreateDirectory(LOGDIR);
            Log("==========");

            File.WriteAllText(LOGRAWFILE, input);
            Dictionary<string, object> parsedInput = ParseInput(input);
            Dictionary<string, string> args = (Dictionary<string, string>) parsedInput["args"];
            string json = (string) parsedInput["json"];
            File.WriteAllText(LOGJSONFILE, json);

            string capManagerHost = FormatUrl(args["capManagerHost"], true);
            string postUrl = capManagerHost + "/import";

            // POST capture data to Capture Manager
            try
            {
                Log("Sending POST request to " + postUrl);
                using (var http = new HttpClient())
                {
                    http.Timeout = TimeSpan.FromSeconds(10);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");
                    var result = http.PostAsync(postUrl, content).Result;
                    string resultContent = result.Content.ReadAsStringAsync().Result;
                    Log("Web server responded with: " + resultContent);
                }
            } catch (Exception e) {
                Log("An error occurred. Possibly due to request timeout.");
                Log(e.ToString());
            }

            // Send output to Arma
            output.Append("Success");
        }


        /* Parses the given input string.
         *
         * Returns:
         *   A dictionary containing two elements - "args" and "json".
         *   "args" is a dictionary containing special arguments supplied by the user
         *   when calling this exentsion.
         *   "json" is a string containing OCAP capture data.
         */
        public static Dictionary<string, object> ParseInput(string input)
        {
            Dictionary<string, object> dict = new Dictionary<string, object>();

            // Very crude parser
            // Split arguments (inside {...}) into a list
            Dictionary<string, string> argDict = new Dictionary<string, string>();
            char c = new char();
            int argCount = 0;
            int index = 0;
            String arg = "";

            Log("Parsing input...");
            while (c != '}')
            {
                index++;
                c = input[index];

                if (c != ';' && c != '}')
                {
                    arg += c;
                }
                else
                {
                    argDict.Add(argKeys[argCount], arg);
                    argCount++;
                    arg = "";
                }
            }
            string json = input.Remove(0, index + 1);

            Log("Done.");
            Log("Args: " + string.Join(";", argDict));
            if (json.Length > 100)
            {
                Log("JSON: " + json.Substring(0, 100) + "...");
            } else
            {
                Log("JSON: " + json);
            }
            Log();

            dict.Add("args", argDict);
            dict.Add("json", json);

            return dict;
        }


        // Format a URL if malformed
        public static string FormatUrl(string url, bool removeTrailingSlash = true)
        {
            if (!(url.StartsWith("http://") || url.StartsWith("https://")))
            {
                url = "http://" + url;
            }

            if (url.EndsWith("/") && removeTrailingSlash)
            {
                url = url.Remove(url.Length - 1);
            }

            return url;
        }


        // Write string to log file and console.
        public static void Log(string str = "")
        {
            File.AppendAllText(LOGFILE, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss | ") + str + Environment.NewLine);
            Console.WriteLine(str);
        }
    }
}
