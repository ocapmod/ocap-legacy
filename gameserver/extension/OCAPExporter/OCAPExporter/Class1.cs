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
using System.Threading;
using System.Net.Http;
using System.Net;

namespace OCAPExporter
{
    public class Main
    {
        const string LOGDIR = "ocap_logs";
        const string LOGFILE = LOGDIR + "/log.txt";
        const string LOGRAWFILE = LOGDIR + "/raw_input.txt";
        const string LOGJSONFILE = LOGDIR + "/processed_input.json";
        static List<string> argKeys = new List<string> { "capManagerHost" };

        [DllExport("RVExtension", CallingConvention = System.Runtime.InteropServices.CallingConvention.Winapi)]
        public static void RvExtension(StringBuilder output, int outputSize, string function)
        {
            outputSize--;
            output.Append("callExtension syntax not supported.");
        }

        // To send a string back to Arma, append to the output StringBuilder. Arma outputSize limit applies!
        [DllExport("RVExtensionArgs", CallingConvention = System.Runtime.InteropServices.CallingConvention.Winapi)]
        public static int RvExtensionArgs(
            StringBuilder output,
            int outputSize,
            [MarshalAs(UnmanagedType.LPStr)] string function,
            [MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.LPStr, SizeParamIndex = 4)] string[] args,
            int argsCnt)
        {
            Thread thread = new Thread(()=>ProcessInput(function, args));
            //thread.IsBackground = true;
            thread.Start();

            // Send output to Arma
            outputSize--;
            output.Append("Call successful");

            return 200;
        }

        public static void ProcessInput(string ocapHost, string[] input)
        {
            Directory.CreateDirectory(LOGDIR);
            Log("==========");
            Log(string.Join(" | ", input), LOGRAWFILE, append: false, logToConsole: false);

            String json = "";
            try
            {
                json = String.Format("{{\"header\": {0},\"entities\": {1},\"events\": {2}}}", input[0], input[1], input[2]);
            } catch (FormatException e)
            {
                Log("Error formatting input to json.");
                Log(e.ToString());
                return;
            }
            json = json.Replace("\"\"", "\\\""); // Replace double quotes with escaped quotes

            Log(json, LOGJSONFILE, append: false, logToConsole: false, isJson: true);

            ocapHost = FormatUrl(ocapHost, true);
            string postUrl = ocapHost + "/import";

            // POST capture data to OCAP webserver
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
            }
            catch (Exception e)
            {
                Log("An error occurred. Possibly due to request timeout.");
                Log(e.ToString());
            }
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
        public static void Log(string str = "", string filePath = LOGFILE, bool append = true, bool logToConsole = true, bool isJson = false)
        {
            if (logToConsole)
            {
                Console.WriteLine(str);
            }

            filePath = filePath.Replace("/", "\\");
            using (StreamWriter writer = new StreamWriter(filePath, append: append))
            {
                if (isJson)
                {
                    writer.WriteLine(str);
                } else
                {
                    writer.WriteLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss | ") + str);
                }
                
            }
        }
    }
}
