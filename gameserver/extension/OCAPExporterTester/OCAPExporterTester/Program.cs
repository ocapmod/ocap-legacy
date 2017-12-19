using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OCAPExporterTester
{
    class Program
    {
        static void Main(string[] args)
        {
            string input = "{localhost:5000}{\"myKey\": \"myValue\"}";
            OCAPExporter.Main.RVExtension(new StringBuilder(), 1024, input);

            //AARExporter.Main.Test();
            Console.WriteLine("Press any key to exit.");
            Console.ReadKey();
        }
    }
}
