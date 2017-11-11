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
            //string input = "{write;test.json}Some dummy data";
            //string input = "{transferLocal;test.json;x;x;x;http://localhost;F:/xampp/htdocs;}";
            string input = "{transferRemote;test.json;x;x;x;http://localhost;}";
            OCAPExporter.Main.RVExtension(new StringBuilder(), 1024, input);

            //AARExporter.Main.Test();
            Console.WriteLine("Press any key to exit.");
            Console.ReadKey();
        }
    }
}
