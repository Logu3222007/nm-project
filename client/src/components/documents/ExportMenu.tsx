import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExportFormat } from "@/lib/constants";

export function ExportMenu({
  onExport,
  exporting,
}: {
  onExport: (format: ExportFormat) => void;
  exporting: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" loading={exporting}>
          <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 w-40 rounded-md border border-border bg-surface p-1 shadow-md"
        >
          {(["pdf", "docx", "txt"] as ExportFormat[]).map((format) => (
            <DropdownMenu.Item
              key={format}
              onSelect={() => onExport(format)}
              className="cursor-pointer rounded-sm px-2 py-1.5 text-sm uppercase outline-none hover:bg-background"
            >
              {format}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
