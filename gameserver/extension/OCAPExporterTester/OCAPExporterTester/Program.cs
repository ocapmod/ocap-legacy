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
            TestNewUnit();
            TestNewVehicle();
            TestUpdateUnit();
            TestExport();
            Console.WriteLine("Press any key to exit.");
            Console.ReadKey();
        }

        static void TestNewUnit()
        {
            string[] args = {
                "0",
                "0",
                "Bob",
                "Bob's Group",
                "Blufor",
                "1"
            };

            OCAPExporter.Main.RvExtensionArgs(new StringBuilder(), 1024, "new_unit", args, args.Length);
        }

        static void TestNewVehicle()
        {
            string[] args = {
                "0",
                "0",
                "Hot Wheels",
                "Supercharger"
            };

            OCAPExporter.Main.RvExtensionArgs(new StringBuilder(), 1024, "new_vehicle", args, args.Length);
        }

        static void TestUpdateUnit()
        {
            string[] args = {
                "0",
                "[1,2]",
                "180",
                "1",
                "0"
            };

            OCAPExporter.Main.RvExtensionArgs(new StringBuilder(), 1024, "update_unit", args, args.Length);
        }

        static void TestExport()
        {
            string[] args = { };
            OCAPExporter.Main.RvExtensionArgs(new StringBuilder(), 1024, "export", args, args.Length);
        }
    }
}
