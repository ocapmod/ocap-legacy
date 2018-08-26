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
using System.Diagnostics;
using Newtonsoft.Json;

namespace OCAPExporter
{
    public class Main
    {
        static readonly string DATETIME_START = DateTime.Now.ToString("yyyy-dd-M_HH-mm-ss");
        const string LOGDIR = "ocap_logs";
        static readonly string LOGFILE = Path.Combine(LOGDIR, String.Format("log_{0}.txt", DATETIME_START));
        static readonly string LOGJSONFILE = Path.Combine(LOGDIR, String.Format("publish_{0}.json", DATETIME_START));
				const int HTTP_TIMEOUT = 60 * 10; 
				static DirectoryInfo logDirInfo  = Directory.CreateDirectory(LOGDIR);
        static Dictionary<string, object> captureData;
        static List<object> entities;
        static List<object> events;

        // Commands
        const string CMD_INIT = "init";
        const string CMD_NEW_UNIT = "new_unit";
        const string CMD_NEW_VEHICLE = "new_vehicle";
        const string CMD_UPDATE_UNIT = "update_unit";
        const string CMD_UPDATE_VEHICLE = "update_vehicle";
				const string CMD_DELETE_ENTITY = "delete_entity";
        const string CMD_PUBLISH = "publish";
        const string CMD_LOG = "log";

        [DllExport("RVExtension", CallingConvention = System.Runtime.InteropServices.CallingConvention.Winapi)]
        public static void RvExtension(StringBuilder output, int outputSize, string function)
        {
            outputSize--;
            output.Append("Please provide args.");
        }

        [DllExport("RVExtensionArgs", CallingConvention = System.Runtime.InteropServices.CallingConvention.Winapi)]
        public static int RvExtensionArgs(
            StringBuilder output,
            int outputSize,
            [MarshalAs(UnmanagedType.LPStr)] string function,
            [MarshalAs(UnmanagedType.LPArray, ArraySubType = UnmanagedType.LPStr, SizeParamIndex = 4)] string[] args,
            int argsCnt)
        {
						// I know, a big try/catch like this is lazy
						try
						{
								args = CleanArgs(args);
								switch (function)
								{
										case CMD_INIT:
												Init();
												break;
										case CMD_UPDATE_UNIT:
												if (!AreArgsValid(CMD_UPDATE_UNIT, args, 6)) { break; };
												UpdateUnit(
														frameNumber: int.Parse(args[0]),
														id: int.Parse(args[1]),
														position: StringToIntArray(args[2]),
														direction: int.Parse(args[3]),
														isAlive: int.Parse(args[4]),
														isInVehicle: int.Parse(args[5])
												);
												break;
										case CMD_UPDATE_VEHICLE:
												if (!AreArgsValid(CMD_UPDATE_VEHICLE, args, 6)) { break; };
												UpdateVehicle(
														frameNumber: int.Parse(args[0]),
														id: int.Parse(args[1]),
														position: StringToIntArray(args[2]),
														direction: int.Parse(args[3]),
														isAlive: int.Parse(args[4]),
														crewIds: StringToIntArray(args[5])
												);
												break;
										case CMD_NEW_UNIT:
												if (!AreArgsValid(CMD_NEW_UNIT, args, 6)) { break; };
												NewUnit(
														frameNumber: int.Parse(args[0]),
														id: int.Parse(args[1]),
														name: args[2],
														group: args[3],
														side: args[4],
														isPlayer: int.Parse(args[5])
												);
												break;
										case CMD_NEW_VEHICLE:
												if (!AreArgsValid(CMD_NEW_VEHICLE, args, 4)) { break; };
												NewVehicle(
														frameNumber: int.Parse(args[0]),
														id: int.Parse(args[1]),
														name: args[2],
														className: args[3]
												);
												break;
										case CMD_DELETE_ENTITY:
												if (!AreArgsValid(CMD_DELETE_ENTITY, args, 3)) { break; };
												SetEntityDeleted(
														frameNumber: int.Parse(args[0]),
														id: int.Parse(args[1]),
														isUnit: args[2] == "1"
												);
												break;
										case CMD_PUBLISH:
												if (!AreArgsValid(CMD_PUBLISH, args, 6)) { break; };
												Publish(args);
												break;
										case CMD_LOG:
												if (!AreArgsValid(CMD_LOG, args, 1)) { break; };
												Log(args[0], fromGame: true);
												break;
								}
						} catch (Exception e)
						{
								Log(string.Format("Args provided: {0}", string.Join(",", args)), isError: true);
								Log(e.ToString(), isError: true);
						}

            // Send output to Arma
            outputSize--;
            output.Append("Call complete");

            return 200;
        }

        public static void Init()
        {
            entities = new List<object>();
            events = new List<object>();
            captureData = new Dictionary<string, object>() {
                {"captureId", "" },
                {"worldName", "" },
                {"missionName", "" },
                {"author", "" },
                {"captureDelay", 0 },
                {"frameCount", 0 },
                { "entities", entities },
                { "events", events },
           };

            Log("Initialised new capture");
        }

        public static void NewUnit(int frameNumber, int id, string name, string group, string side, int isPlayer)
        {
            entities.Add(
                new List<object> {
                    new List<object> { // Header
                        1, // Is unit
                        id,
                        name,
                        group,
                        side,
                        isPlayer,
												frameNumber, // Frame number created at
												null // Frame number deleted at
                    },
                    new Dictionary<int, List<object>>(), // States
                    new List<int>(), // Frames fired
                }
            );
        }

        public static void NewVehicle(int frameNumber, int id, string name, string className)
        {
            entities.Add(
                new List<object> {
                    new List<object> { // Header
                        0, // Is unit
                        id,
                        name,
                        className,
												frameNumber, // Frame number created at
												null // Frame number deleted at
                    },
									 new Dictionary<int, List<object>>(), // States
                }
            );
        }

        public static void UpdateUnit(int frameNumber, int id, int[] position, int direction, int isAlive, int isInVehicle)
        {
            List<object> unit = (List<object>)entities[id];
						Dictionary<int, List<object>> states = (Dictionary<int, List<object>>) unit[1];

            states.Add(frameNumber,
								new List<object> {
										position,
										direction,
										isAlive,
										isInVehicle,
								}
						);
        }

        public static void UpdateVehicle(int frameNumber, int id, int[] position, int direction, int isAlive, int[] crewIds)
        {
            List<object> vehicle = (List<object>)entities[id];
						Dictionary<int, List<object>> states = (Dictionary<int, List<object>>) vehicle[1];

						states.Add(frameNumber,
								new List<object> {
										position,
										direction,
										isAlive,
										crewIds,
								}
						);
        }

				public static void SetEntityDeleted(int frameNumber, int id, bool isUnit)
				{
						List<object> entity = (List<object>)entities[id];
						List<object> header = (List<object>)entity[0];

						int index = isUnit ? 7 : 5;
						header[index] = frameNumber;
				}

        // TODO: Run this in separate thread
        public static void Publish(string[] args)
        {
            Log("Publishing data...");
            Log("Publish args:");
            Log(String.Join(",", args));
            string json = null;
            string postUrl = FormatUrl(args[0]) + "/import";
            string missionName = args[2];
            string captureId = String.Format("{0}_{1}", missionName, DateTime.Now.ToString("yyyy-dd-M_HH-mm-ss"));

            captureData["captureId"] = captureId;
            captureData["worldName"] = args[1];
            captureData["missionName"] = missionName;
            captureData["author"] = args[3];
            captureData["captureDelay"] = int.Parse(args[4]);
            captureData["frameCount"] = int.Parse(args[5]);

            try
            {
                json = JsonConvert.SerializeObject(captureData);
            }
            catch (Exception e)
            {
                Log("Could not serialise data into json", isError: true);
                Log(e.ToString(), isError: true);
            }

            if (json == null) { return; };
            LogJson(json);

						Thread thread = new Thread(() => PostCapture(postUrl, json));
						thread.IsBackground = true;
						thread.Start();
        }

				public static void PostCapture(string url, string json)
				{
						// POST capture data to OCAP webserver
						try
						{
								Log("Sending POST request to " + url);
								using (HttpClient http = new HttpClient())
								{
										Stopwatch watch = Stopwatch.StartNew();

										http.Timeout = TimeSpan.FromSeconds(HTTP_TIMEOUT);
										StringContent content = new StringContent(json, Encoding.UTF8, "application/json");
										HttpResponseMessage result = http.PostAsync(url, content).Result;

										watch.Stop();
										Log(string.Format("Request sent ({0}s)", watch.ElapsedMilliseconds / 1000.0));

										string resultContent = result.Content.ReadAsStringAsync().Result;
										Log("Web server responded with: " + resultContent);
								}
						}
						catch (Exception e)
						{
								Log("An error occurred while sending POST request. Possibly due to timeout.", isError: true);
								Log(e.ToString(), isError: true);
						}

						Log("Publish complete");
				}


        public static int[] StringToIntArray(string input)
        {
            input = input.Replace("[", "").Replace("]", "");
            if (input.Length == 0) { return new int[0]; };

            string[] inputArray = input.Split(',');
            try
            {
                return Array.ConvertAll(inputArray, int.Parse);
            } catch (Exception e)
            {
                Log("Could not convert string to int array: " + input, isError: true);
                Log(e.ToString(), isError: true);
            }

            return null;
        }

        public static string[] CleanArgs(string[] args)
        {
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                args[i] = arg.TrimStart('\"').TrimEnd('\"');
            };

            return args;
        }

        // Check if length of args in args array matches expected length
        public static bool AreArgsValid(string funcName, string[] args, int expectedLength)
        {
            int length = args.Length;
            if (length != expectedLength)
            {
                Log(String.Format("{0}: {1} args provided, {2} expected.", funcName, length, expectedLength), isError: true);
                Log(String.Format("Args provided: {0}", args), isError: true);
                return false;
            }

            return true;
        }

        // Format a URL if malformed
        public static string FormatUrl(string url, bool removeTrailingSlash = true)
        {
            // Fallback to http if protocol not defined
            if (!(url.StartsWith("http://") || url.StartsWith("https://")))
            {
                url = "http://" + url;
            }

            if (url.EndsWith("/") && removeTrailingSlash)
            {
                url = url.TrimEnd('/');
            }

            return url;
        }

        // Write string to log file and console.
        public static void Log(string str = "", bool isError = false, bool fromGame = false)
        {
            if (isError)
            {
                str = "Error: " + str;
            }

            if (fromGame)
            {
                str = "Arma | " + str;
            } else
            {
                str = "Ext  | " + str;
            }

            Console.WriteLine(str);
            File.AppendAllText(LOGFILE, String.Format("{0} | {1}{2}", DateTime.Now.ToString("HH:mm:ss"), str, Environment.NewLine));
        }

        public static void LogJson(string json)
        {
            File.WriteAllText(LOGJSONFILE, json);
        }
    }
}
