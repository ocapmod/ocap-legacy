/*

    ==========================================================================================

    Copyright (C) 2016 Jamie Goodson (aka MisterGoodson) (goodsonjamie@yahoo.co.uk)

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

 * Exports supplied capture JSON string into a JSON file.
 * JSON string can (and should) be supplied in multiple separate calls to this extension (as to avoid the Arma buffer limit).
 * This extension also handles transferring of JSON file to either a local or remote (via FTP) location.
 * 
 * Extension argument string can be 1 of 3 forms.
 * f1:
 *     {write;arg1}json_string_part
 *     "write" = Tells the extension to write json_string_part to a file (in /tmp)
 *     arg1 = Json filename to write/append to /tmp (e.g. "myfile.json")
 *     json_string_part = Partial json string to be written to a file.
 * f2:
 *     {transferLocal;arg1;arg2;arg3;arg4;arg5;arg6}
 *     "transferLocal" = Tells the extension we wish to transfer the json file to a local directory
 *     arg1 = Json filename to move from /tmp (e.g. "myfile.json")
 *     arg2 = World name
 *     arg3 = Mission name
 *     arg4 = Mission duration (seconds)
 *     arg5 = URL to web directory where OCAP is hosted (must include trailing '/')
 *     arg6 = Absolute path to directory where JSON file should be moved to
 * f3:
 *     {transferRemote;arg1;arg2;arg3;arg4;arg5;arg6;arg7;arg8}
 *     "transferRemote" = Tells the extension we wish to transfer the json file to a remote server (via FTP)
 *     arg1 to arg5 = Same as f2
 *     arg6 = FTP host
 *     arg7 = FTP username
 *     arg8 = FTP password
 */

using RGiesecke.DllExport;
using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Net.Http;

namespace OCAPExporter
{
    public class Main
    {
        static string logfile = "ocap_log.txt";

        // This 2 line are IMPORTANT and if changed will stop everything working
        // To send a string back to ARMA append to the output StringBuilder, ARMA outputSize limit applies!
        [DllExport("_RVExtension@12", CallingConvention = System.Runtime.InteropServices.CallingConvention.Winapi)]
        public static void RVExtension(StringBuilder output, int outputSize, [MarshalAs(UnmanagedType.LPStr)] string function)
        {
            outputSize--;

            // Grab arguments from function string (arguments are wrapped in curly brackets).
            // e.g. {arg1;arg2;arg3}restOfFunctionString
            char c = new char();
            int index = 0;
            List<String> args = new List<String>();
            String arg = "";

            // Very crude parser
            // TODO: Use better parser that doesn't break when a '{' or '}' char exists in one of the args
            log("Arguments supplied: " + function);
            log("Parsing arguments...");
            while (c != '}')
            {
                index++;
                c = function[index];

                if (c != ';' && c != '}')
                {
                    arg += c;
                }
                else
                {
                    args.Add(arg);
                    arg = "";
                }
            }
            log("Done.");

            // Define variables (from args)
            string option = args[0];
            string captureFilename = args[1];
            string tempDir = @"Temp\";
            string captureFilepath = tempDir + captureFilename; // Relative path where capture file will be written to
            //string captureFilepath = System.AppDomain.CurrentDomain.BaseDirectory + @"tmp\" + captureFilename;

            // Remove arguments from function string
            function = function.Remove(0, index + 1);

            // Write string to JSON file
            if (option.Equals("write"))
            {
                // Create temp directory if not already exists
                if (!Directory.Exists(tempDir))
                {
                    log("Temp directory not found, creating...");
                    Directory.CreateDirectory(tempDir);
                    log("Done.");
                }

                // Create file to write to (if not exists)
                if (!File.Exists(captureFilepath))
                {
                    log("Capture file not found, creating at " + captureFilepath + "...");
                    File.Create(captureFilepath).Close();
                    log("Done.");
                }

                // Append to file
                File.AppendAllText(captureFilepath, function);
                log("Appended capture data to capture file.");

            } else {
                string worldName = args[2];
                string missionName = args[3];
                string missionDuration = args[4];
                string postUrl = args[5];
                postUrl += "data/receive.php";

                // Transfer JSON file to a local location
                if (option.Equals("transferLocal"))
                {
                    try
                    {
                        string webRoot = args[6]; // Must include trailing '/'
                        string transferFilepath = webRoot + "data/" + captureFilename;

                        // Move JSON file from /tmp to transferPath
                        log("Moving " + captureFilename + " to " + transferFilepath + "...");
                        File.Move(captureFilepath, transferFilepath);
                        log("Done");
                    } catch (Exception e)
                    {
                        log(e.ToString());
                    }

                }

                // Transfer JSON file to a remote location (via FTP)
                else if (option.Equals("transferRemote"))
                {
                    string ftpHost = args[6];
                    string ftpUsername = args[7];
                    string ftpPassword = args[8];

                    // Transfer file via FTP
                    // TODO
                }

                // POST worldName/missionName/missionDuration to website (send to PHP file) 
                try
                {
                    log("Sending POST data to " + postUrl);
                    using (var http = new HttpClient())
                    {
                        var postValues = new Dictionary<string, string>
                        {
                            {"worldName", worldName },
                            {"missionName", missionName },
                            {"missionDuration", missionDuration },
                            {"filename", captureFilename }
                        };
                        var content = new FormUrlEncodedContent(postValues);
                        var result = http.PostAsync(postUrl, content).Result;
                        string resultContent = result.Content.ReadAsStringAsync().Result;
                        log(resultContent);
                    }
                } catch (Exception e)
                {
                    log(e.ToString());
                }
            }

            log("All tasks complete.");

            // Send output to Arma
            output.Append("Success");
        }

        public static void log(string str)
        {
            File.AppendAllText(logfile, DateTime.Now.ToString("dd/MM/yyyy H:mm | ") + str + Environment.NewLine);
            Console.WriteLine(str);
        }
    }
}
