using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OCAPExporterTester
{
    class Program
    {
        static void Main()
        {
            string[] args = { "1", "2", "3" };
            int argsCnt = 3;

            OCAPExporter.Main.RvExtensionArgs(new StringBuilder(), 1024, "main", args, argsCnt);

            Console.WriteLine("Press any key to exit.");
            Console.ReadKey();
        }
    }
}
