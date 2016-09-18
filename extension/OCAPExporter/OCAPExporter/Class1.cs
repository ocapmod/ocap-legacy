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
 *     arg5 = URL to web directory where OCAP is hosted
 *     arg6 = Absolute path to directory where JSON file should be moved to
 * f3:
 *     {transferRemote;arg1;arg2;arg3;arg4;arg5}
 *     "transferRemote" = Tells the extension we wish to transfer the json file to a remote server (via POST)
 *     arg1 to arg5 = Same as f2
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
            Log("Arguments supplied: " + function);
            Log("Parsing arguments...");
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
            Log("Done.");

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
                    Log("Temp directory not found, creating...");
                    Directory.CreateDirectory(tempDir);
                    Log("Done.");
                }

                // Create file to write to (if not exists)
                if (!File.Exists(captureFilepath))
                {
                    Log("Capture file not found, creating at " + captureFilepath + "...");
                    File.Create(captureFilepath).Close();
                    Log("Done.");
                }

                // Append to file
                File.AppendAllText(captureFilepath, function);
                Log("Appended capture data to capture file.");

            } else {
                string worldName = args[2];
                string missionName = args[3];
                string missionDuration = args[4];
                string ocapUrl = args[5];
                if (!ocapUrl.StartsWith("http://"))
                {
                    ocapUrl += "http://";
                }
                ocapUrl = AddMissingSlash(ocapUrl);
                string postUrl = ocapUrl + "data/receive.php";

                // Transfer JSON file to a local location
                if (option.Equals("transferLocal"))
                {
                    string webRoot = args[6];
                    webRoot = AddMissingSlash(webRoot);
                    string transferFilepath = webRoot + "data/" + captureFilename;

                    try
                    {
                        // Move JSON file from /tmp to transferPath
                        Log("Moving " + captureFilename + " to " + transferFilepath + "...");
                        File.Move(captureFilepath, transferFilepath);
                        Log("Done");
                    } catch (Exception e)
                    {
                        Log(e.ToString());
                    }

                }

                // Transfer JSON file to a remote location
                else if (option.Equals("transferRemote"))
                {
                    // POST file
                    try
                    {
                        Log("Sending " + captureFilename + " to " + postUrl + "...");
                        using (var http = new HttpClient()) using (var formData = new MultipartFormDataContent())
                        {
                            HttpContent fileBytes = new ByteArrayContent(File.ReadAllBytes(captureFilepath));
                            formData.Add(new StringContent("addFile"), "option");
                            formData.Add(new StringContent(captureFilename), "fileName");
                            formData.Add(fileBytes, "fileContents");
                            var result = http.PostAsync(postUrl, formData).Result;
                            string resultContent = result.Content.ReadAsStringAsync().Result;
                            Log("Web server responded with: " + resultContent);
                        }
                    }
                    catch (Exception e)
                    {
                        Log(e.ToString());
                    }
                }

                // POST worldName/missionName/missionDuration 
                try
                {
                    Log("Sending POST data to " + postUrl);
                    using (var http = new HttpClient())
                    {
                        var postValues = new Dictionary<string, string>
                        {
                            {"option", "dbInsert"},
                            {"worldName", worldName },
                            {"missionName", missionName },
                            {"missionDuration", missionDuration },
                            {"filename", captureFilename }
                        };
                        var content = new FormUrlEncodedContent(postValues);
                        var result = http.PostAsync(postUrl, content).Result;
                        string resultContent = result.Content.ReadAsStringAsync().Result;
                        Log("Web server responded with: " + resultContent);
                    }
                } catch (Exception e)
                {
                    Log(e.ToString());
                }
            }

            Log("Tasks complete.");

            // Send output to Arma
            output.Append("Success");
        }

        public static void Log(string str)
        {
            File.AppendAllText(logfile, DateTime.Now.ToString("dd/MM/yyyy H:mm | ") + str + Environment.NewLine);
            Console.WriteLine(str);
        }

        public static string AddMissingSlash(string str)
        {
            if (!str.EndsWith("/"))
            {
                str += "/";
            }

            return str;
        }
    }
}
